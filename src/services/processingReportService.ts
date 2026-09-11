import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { ProcessingReport, ProcessingReportStatus, Evidence } from '../types';

// ─────────────────────────────────────────────
// LOCAL CACHE HELPERS
// ─────────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'waste2worth:processingReports';

function getLocalReports(): Record<string, ProcessingReport> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalReport(report: ProcessingReport) {
  try {
    const map = getLocalReports();
    map[report.processingReportId] = report;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────

function generateReportId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `RPT-${year}-${rand}`;
}

// ─────────────────────────────────────────────
// CREATE PROCESSING REPORT
// ─────────────────────────────────────────────

export async function createProcessingReport(
  data: Omit<ProcessingReport, 'processingReportId' | 'evidence' | 'status' | 'submittedAt' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const processingReportId = generateReportId();

  const newReport: ProcessingReport = {
    ...data,
    processingReportId,
    evidence: [],
    status: 'SUBMITTED' as ProcessingReportStatus,
    submittedAt: new Date().toISOString() as any,
    createdAt: new Date().toISOString() as any,
    updatedAt: new Date().toISOString() as any,
  };

  saveLocalReport(newReport);

  try {
    if (db) {
      await addDoc(collection(db, 'processingReports'), {
        ...newReport,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Failed to write processing report to Firestore, saved to local cache', err);
  }

  return processingReportId;
}

// ─────────────────────────────────────────────
// GET REPORTS BY RECYCLER
// ─────────────────────────────────────────────

export async function getProcessingReportsByRecycler(recyclerId: string): Promise<ProcessingReport[]> {
  try {
    const q = query(
      collection(db, 'processingReports'),
      where('recyclerId', '==', recyclerId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const reports = snap.docs.map((d) => ({ ...d.data() } as ProcessingReport));
      reports.forEach(saveLocalReport);
      return reports;
    }
  } catch (err) {
    console.warn('Failed to fetch processing reports from Firestore, checking local cache', err);
  }
  const localList = Object.values(getLocalReports());
  return localList.filter((r) => r.recyclerId === recyclerId);
}

// ─────────────────────────────────────────────
// GET REPORT BY TRANSACTION
// ─────────────────────────────────────────────

export async function getProcessingReportByTransaction(transactionId: string): Promise<ProcessingReport | null> {
  try {
    const q = query(
      collection(db, 'processingReports'),
      where('transactionId', '==', transactionId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const r = { ...snap.docs[0].data() } as ProcessingReport;
      saveLocalReport(r);
      return r;
    }
  } catch (err) {
    console.warn('Failed to get processing report from Firestore, checking local cache', err);
  }
  const localList = Object.values(getLocalReports());
  return localList.find((r) => r.transactionId === transactionId) || null;
}

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────

export async function updateProcessingReportStatus(
  processingReportId: string,
  status: ProcessingReportStatus
): Promise<void> {
  const localMap = getLocalReports();
  if (localMap[processingReportId]) {
    localMap[processingReportId].status = status;
    saveLocalReport(localMap[processingReportId]);
  }

  try {
    const q = query(
      collection(db, 'processingReports'),
      where('processingReportId', '==', processingReportId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const docRef = doc(db, 'processingReports', snap.docs[0].id);
    await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn('Failed to update processing report in Firestore, local cache updated', err);
  }
}

// ─────────────────────────────────────────────
// UPLOAD EVIDENCE
// ─────────────────────────────────────────────

export async function uploadProcessingEvidence(
  file: File,
  lotId: string,
  transactionId: string,
  processingReportId: string,
  uploadedBy: string,
  type: Evidence['type'] = 'PROCESSING'
): Promise<Evidence> {
  try {
    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `evidence/${lotId}/${transactionId}/${processingReportId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const evidence: Evidence = {
      evidenceId:  `EV-${Date.now()}`,
      type,
      url,
      uploadedAt:  { seconds: Date.now() / 1000, nanoseconds: 0 } as never,
      uploadedBy,
    };

    return evidence;
  } catch {
    // Local fallback for offline demo
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          evidenceId: `EV-LOCAL-${Date.now()}`,
          type,
          url: reader.result as string,
          uploadedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as never,
          uploadedBy,
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

// ─────────────────────────────────────────────
// APPEND EVIDENCE TO REPORT
// ─────────────────────────────────────────────

export async function appendEvidenceToReport(
  processingReportId: string,
  evidence: Evidence[]
): Promise<void> {
  const localMap = getLocalReports();
  if (localMap[processingReportId]) {
    localMap[processingReportId].evidence = [
      ...(localMap[processingReportId].evidence || []),
      ...evidence,
    ];
    saveLocalReport(localMap[processingReportId]);
  }

  try {
    const q = query(
      collection(db, 'processingReports'),
      where('processingReportId', '==', processingReportId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const docRef = doc(db, 'processingReports', snap.docs[0].id);
    const existing = (snap.docs[0].data().evidence ?? []) as Evidence[];
    await updateDoc(docRef, {
      evidence: [...existing, ...evidence],
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to append evidence in Firestore, local cache updated', err);
  }
}

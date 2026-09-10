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

  await addDoc(collection(db, 'processingReports'), {
    ...data,
    processingReportId,
    evidence: [],
    status: 'PROCESSING' as ProcessingReportStatus,
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return processingReportId;
}

// ─────────────────────────────────────────────
// GET REPORTS BY RECYCLER
// ─────────────────────────────────────────────

export async function getProcessingReportsByRecycler(recyclerId: string): Promise<ProcessingReport[]> {
  const q = query(
    collection(db, 'processingReports'),
    where('recyclerId', '==', recyclerId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data() } as ProcessingReport));
}

// ─────────────────────────────────────────────
// GET REPORT BY TRANSACTION
// ─────────────────────────────────────────────

export async function getProcessingReportByTransaction(transactionId: string): Promise<ProcessingReport | null> {
  const q = query(
    collection(db, 'processingReports'),
    where('transactionId', '==', transactionId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data() } as ProcessingReport;
}

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────

export async function updateProcessingReportStatus(
  processingReportId: string,
  status: ProcessingReportStatus
): Promise<void> {
  const q = query(
    collection(db, 'processingReports'),
    where('processingReportId', '==', processingReportId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const docRef = doc(db, 'processingReports', snap.docs[0].id);
  await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
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
}

// ─────────────────────────────────────────────
// APPEND EVIDENCE TO REPORT
// ─────────────────────────────────────────────

export async function appendEvidenceToReport(
  processingReportId: string,
  evidence: Evidence[]
): Promise<void> {
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
}

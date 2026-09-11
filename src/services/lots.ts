import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  auth,
  db,
  storage,
} from '../config/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { EvidenceReference, Lot } from '../types'
import { queueLot, readLots, updateLotSync } from './offline'

export async function uploadEvidence(collectorId: string, lotId: string, file: File): Promise<EvidenceReference> {
  const currentUid = auth?.currentUser?.uid || collectorId;
  const base: EvidenceReference = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
  };

  const dataUrl = await fileToDataUrl(file);
  let downloadUrl: string | undefined = undefined;
  let storagePath: string | undefined = undefined;

  if (storage && navigator.onLine && auth?.currentUser) {
    try {
      // Use standard authenticated path allowed by storage.rules
      storagePath = `lots/${currentUid}/${lotId}/${base.id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      downloadUrl = await getDownloadURL(snapshot.ref);
    } catch (storageErr) {
      console.warn('[Collector Storage Warning] Cloud storage upload deferred or failed:', storageErr);
    }
  }

  return {
    ...base,
    dataUrl,
    downloadUrl,
    storagePath,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sanitizes lot data before Firestore persistence to ensure:
 * 1. No undefined values are passed (which triggers Firestore errors).
 * 2. Giant base64 data URLs (>20KB) are stripped from Firestore to prevent the 1MB document limit.
 * 3. Proper timestamps, types, and ownership fields are guaranteed.
 */
export function sanitizeLotForFirestore(lot: Lot): Record<string, unknown> {
  const sanitizedEvidence = (lot.evidence || []).map((ev) => {
    if (typeof ev === 'string') {
      return {
        id: crypto.randomUUID(),
        name: 'evidence.jpg',
        type: 'image/jpeg',
        size: 0,
        createdAt: new Date().toISOString(),
        downloadUrl: ev,
      };
    }
    const item = ev as any;
    const clean: Record<string, unknown> = {
      id: item.id || item.evidenceId || crypto.randomUUID(),
      name: item.name || item.fileName || 'evidence.jpg',
      type: item.type || 'image/jpeg',
      size: typeof item.size === 'number' ? item.size : 0,
      createdAt: item.createdAt || item.uploadedAt || new Date().toISOString(),
    };
    const downloadUrl = item.downloadUrl || item.url;
    if (downloadUrl) clean.downloadUrl = downloadUrl;
    if (item.storagePath) clean.storagePath = item.storagePath;
    // Only persist dataUrl directly in Firestore if it is very small (< 20KB) and no cloud URL exists
    const dataUrl = item.dataUrl;
    if (!downloadUrl && dataUrl && typeof dataUrl === 'string' && dataUrl.length < 20000) {
      clean.dataUrl = dataUrl;
    }
    return clean;
  });

  const cond = typeof lot.conditionAssessment === 'object' && lot.conditionAssessment !== null
    ? lot.conditionAssessment
    : undefined;

  const comps = typeof lot.components === 'object' && !Array.isArray(lot.components) && lot.components !== null
    ? lot.components
    : undefined;

  return {
    lotId: lot.lotId,
    clientOperationId: lot.clientOperationId || lot.lotId,
    collectorId: lot.collectorId,
    category: lot.category || 'Other',
    conditionAssessment: {
      working: cond?.working || 'UNKNOWN',
      physicalDamage: Boolean(cond?.physicalDamage),
      waterDamage: Boolean(cond?.waterDamage),
      brokenDisplay: Boolean(cond?.brokenDisplay),
      batteryCondition: cond?.batteryCondition || 'UNKNOWN',
      missingComponents: cond?.missingComponents || '',
      otherDefects: cond?.otherDefects || '',
    },
    components: {
      present: comps?.present || '',
      missing: comps?.missing || '',
      reusable: comps?.reusable || '',
      hazardous: comps?.hazardous || '',
    },
    quantity: Number(lot.quantity) || 0,
    estimatedWeight: Number(lot.estimatedWeight) || 0,
    unit: lot.unit || 'kg',
    askingPrice: Number(lot.askingPrice) || 0,
    evidence: sanitizedEvidence,
    location: lot.location || '',
    status: lot.status || 'LISTED',
    createdAt: lot.createdAt || new Date().toISOString(),
    updatedAt: lot.updatedAt || new Date().toISOString(),
    syncStatus: 'SYNCED',
    notes: lot.notes || '',
  };
}

export async function persistLot(lot: Lot) {
  // Always queue in local offline storage with complete base64 data for instantaneous local display
  queueLot(lot);

  if (!db || !navigator.onLine) {
    return;
  }

  // Ensure authenticated user UID is used for Firestore ownership
  const currentUser = auth?.currentUser;
  const targetLot: Lot = {
    ...lot,
    collectorId: currentUser?.uid || lot.collectorId,
  };

  const firestoreData = sanitizeLotForFirestore(targetLot);

  try {
    await setDoc(doc(db, 'lots', targetLot.lotId), firestoreData);
    updateLotSync(targetLot.lotId, 'SYNCED');
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.error('[Collector Sync Error] Firestore persistLot failed:', {
      code: error?.code || 'UNKNOWN',
      message: error?.message || String(err),
      authenticatedUid: auth?.currentUser?.uid || null,
      isAuth: !!auth?.currentUser,
      collectionPath: `lots/${targetLot.lotId}`,
      collectorId: targetLot.collectorId,
      rawError: err,
    });
    throw err;
  }
}

export async function syncPendingLots() {
  if (!db || !navigator.onLine) return;
  const pending = readLots().filter(
    (item) => item.syncStatus === 'PENDING_SYNC' || item.syncStatus === 'SYNC_ERROR'
  );
  for (const lot of pending) {
    try {
      updateLotSync(lot.lotId, 'SYNCING');
      const currentUser = auth?.currentUser;
      const targetLot: Lot = {
        ...lot,
        collectorId: currentUser?.uid || lot.collectorId,
      };
      const firestoreData = sanitizeLotForFirestore(targetLot);
      await setDoc(doc(db, 'lots', targetLot.lotId), firestoreData);
      updateLotSync(targetLot.lotId, 'SYNCED');
    } catch (err) {
      console.error('[Collector Sync Error] syncPendingLots retry failed for lot:', lot.lotId, err);
      updateLotSync(lot.lotId, 'SYNC_ERROR');
    }
  }
}

export async function loadRemoteLots(collectorId: string) {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'lots'), where('collectorId', '==', collectorId)));
  return snapshot.docs.map((item) => item.data() as Lot);
}

export async function saveProfileToFirebase(profile: Record<string, unknown>) {
  if (!db) return;
  await setDoc(doc(db, 'collectorProfiles', String(profile.collectorId)), profile);
  await setDoc(doc(db, 'users', String(profile.collectorId)), {
    userId: profile.collectorId,
    role: 'COLLECTOR',
    email: profile.email,
    fullName: profile.fullName,
  });
}


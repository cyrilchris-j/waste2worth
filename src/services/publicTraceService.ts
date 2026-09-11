import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PublicTraceTimelineEvent {
  status: string;
  label: string;
  timestamp: string;
}

export interface PublicRecoverySummary {
  inputWeightKg?: number;
  processedWeightKg?: number;
  residualWeightKg?: number;
  materials?: Array<{ material: string; quantityKg: number }>;
}

export interface PublicTrace {
  lotId: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  transactionReference?: string | null;
  processingStatus?: string | null;
  timeline: PublicTraceTimelineEvent[];
  recoverySummary?: PublicRecoverySummary;
  publicMilestones?: string[];
}

const LOCAL_STORAGE_KEY = 'waste2worth:publicTraces';

function getLocalCache(): Record<string, PublicTrace> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalCache(cache: Record<string, PublicTrace>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export async function publishPublicTrace(trace: PublicTrace): Promise<void> {
  // Always update local cache for resilience
  const cache = getLocalCache();
  cache[trace.lotId] = trace;
  saveLocalCache(cache);

  if (!db) return;
  try {
    await setDoc(doc(db, 'publicTraces', trace.lotId), {
      ...trace,
      syncedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.info('Public trace Firestore sync deferred or offline:', err);
  }
}

export async function updatePublicTrace(lotId: string, updates: Partial<PublicTrace>): Promise<void> {
  const cache = getLocalCache();
  const existing = cache[lotId] || {} as Partial<PublicTrace>;
  const mergedTimeline = updates.timeline && existing.timeline
    ? [...existing.timeline, ...updates.timeline.filter(e => !existing.timeline?.some(x => x.status === e.status))]
    : updates.timeline || existing.timeline;

  const merged = {
    ...existing,
    ...updates,
    timeline: mergedTimeline || [],
    updatedAt: new Date().toISOString(),
  } as PublicTrace;

  cache[lotId] = merged;
  saveLocalCache(cache);

  if (!db) return;
  try {
    const docRef = doc(db, 'publicTraces', lotId);
    await setDoc(docRef, {
      ...updates,
      timeline: mergedTimeline,
      updatedAt: new Date().toISOString(),
      syncedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.info('Could not update Firestore public trace:', err);
  }
}

export const updatePublicTraceProjection = updatePublicTrace;

export async function getPublicTrace(lotId: string): Promise<PublicTrace | null> {
  // Try real Firestore first
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'publicTraces', lotId));
      if (snap.exists()) {
        const data = snap.data() as PublicTrace;
        // Update local cache
        const cache = getLocalCache();
        cache[lotId] = data;
        saveLocalCache(cache);
        return data;
      }
    } catch {
      // Permission error or network issue, proceed to local cache
    }
  }

  // Fallback to local cache
  const cache = getLocalCache();
  if (cache[lotId]) {
    return cache[lotId];
  }

  return null;
}

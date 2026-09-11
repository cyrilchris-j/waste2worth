import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Lot, LotStatus, EWasteCategory } from '../types';
import { readLots, writeLots } from './offline';

// ─────────────────────────────────────────────
// CASE-INSENSITIVE CATEGORY MATCHING (FIX 4)
// ─────────────────────────────────────────────

export function matchesCategory(lotCategory: string, acceptedCategories?: string[]): boolean {
  if (!acceptedCategories || acceptedCategories.length === 0) return true;
  const target = String(lotCategory || '').trim().toLowerCase();
  return acceptedCategories.some((c) => String(c).trim().toLowerCase() === target);
}

// ─────────────────────────────────────────────
// GET LISTED LOTS compatible with recycler categories
// ─────────────────────────────────────────────

export async function getListedLots(acceptedCategories?: (EWasteCategory | string)[]): Promise<Lot[]> {
  let lots: Lot[] = [];

  try {
    const q = query(
      collection(db, 'lots'), 
      where('status', '==', 'LISTED'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    lots = snap.docs.map((d) => ({ ...d.data(), lotId: d.id } as Lot));
  } catch (err) {
    console.warn('Failed to query listed lots from Firestore, checking offline lots cache', err);
  }

  // Merge with offline cached listed lots
  const localListed = readLots().filter((l) => l.status === 'LISTED');
  const seenIds = new Set(lots.map((l) => l.lotId));
  for (const l of localListed) {
    if (!seenIds.has(l.lotId)) {
      lots.push(l);
      seenIds.add(l.lotId);
    }
  }

  // Filter by recycler's accepted categories (client-side for flexibility)
  if (acceptedCategories && acceptedCategories.length > 0) {
    lots = lots.filter((lot) => matchesCategory(lot.category, acceptedCategories as string[]));
  }

  return lots;
}

// ─────────────────────────────────────────────
// GET SINGLE LOT
// ─────────────────────────────────────────────

export async function getLotById(lotId: string): Promise<Lot | null> {
  try {
    const snap = await getDoc(doc(db, 'lots', lotId));
    if (snap.exists()) {
      return { ...snap.data(), lotId: snap.id } as Lot;
    }
  } catch (err) {
    console.warn('Failed to fetch lot from Firestore, checking offline cache', err);
  }

  // Fallback to local offline cache
  const localLots = readLots();
  const found = localLots.find((l) => l.lotId === lotId);
  return found || null;
}

// ─────────────────────────────────────────────
// UPDATE LOT STATUS (recycler acceptance)
// ─────────────────────────────────────────────

export async function updateLotStatus(lotId: string, status: LotStatus): Promise<void> {
  // Update local offline cache
  const lots = readLots();
  const found = lots.find((l) => l.lotId === lotId);
  if (found) {
    writeLots(lots.map((l) => (l.lotId === lotId ? { ...l, status } : l)));
  }

  try {
    await updateDoc(doc(db, 'lots', lotId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not update lot in Firestore, offline cache updated', err);
  }
}

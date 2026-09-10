import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Lot, LotStatus, EWasteCategory } from '../types';

// ─────────────────────────────────────────────
// GET LISTED LOTS compatible with recycler categories
// ─────────────────────────────────────────────

export async function getListedLots(acceptedCategories?: EWasteCategory[]): Promise<Lot[]> {
  let q = query(collection(db, 'lots'), where('status', '==', 'LISTED'));

  const snap = await getDocs(q);
  let lots = snap.docs.map((d) => ({ ...d.data(), lotId: d.id } as Lot));

  // Filter by recycler's accepted categories (client-side for flexibility)
  if (acceptedCategories && acceptedCategories.length > 0) {
    lots = lots.filter((lot) => acceptedCategories.includes(lot.category));
  }

  return lots;
}

// ─────────────────────────────────────────────
// GET SINGLE LOT
// ─────────────────────────────────────────────

export async function getLotById(lotId: string): Promise<Lot | null> {
  const snap = await getDoc(doc(db, 'lots', lotId));
  if (!snap.exists()) return null;
  return { ...snap.data(), lotId: snap.id } as Lot;
}

// ─────────────────────────────────────────────
// UPDATE LOT STATUS (recycler acceptance)
// ─────────────────────────────────────────────

export async function updateLotStatus(lotId: string, status: LotStatus): Promise<void> {
  await updateDoc(doc(db, 'lots', lotId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

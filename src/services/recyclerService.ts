import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { RecyclerProfile, VerificationStatus } from '../types';

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createRecyclerProfile(
  userId: string,
  data: Omit<RecyclerProfile, 'recyclerId' | 'userId' | 'verificationStatus' | 'verificationNotes' | 'verifiedAt' | 'verifiedBy' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  await setDoc(doc(db, 'recyclerProfiles', userId), {
    ...data,
    recyclerId: userId,
    userId,
    verificationStatus: 'PENDING' as VerificationStatus,
    verificationNotes: '',
    verifiedAt: null,
    verifiedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getRecyclerProfile(userId: string): Promise<RecyclerProfile | null> {
  const snap = await getDoc(doc(db, 'recyclerProfiles', userId));
  if (!snap.exists()) return null;
  return { ...snap.data(), recyclerId: userId } as RecyclerProfile;
}

// ─────────────────────────────────────────────
// UPDATE — own profile
// ─────────────────────────────────────────────

export async function updateRecyclerProfile(
  userId: string,
  data: Partial<RecyclerProfile>
): Promise<void> {
  await updateDoc(doc(db, 'recyclerProfiles', userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// ADMIN — update verification status
// ─────────────────────────────────────────────

export async function adminSetVerificationStatus(
  recyclerId: string,
  status: VerificationStatus,
  notes: string,
  adminUserId: string
): Promise<void> {
  await updateDoc(doc(db, 'recyclerProfiles', recyclerId), {
    verificationStatus: status,
    verificationNotes: notes,
    verifiedAt: status === 'VERIFIED' ? serverTimestamp() : null,
    verifiedBy: status === 'VERIFIED' ? adminUserId : null,
    updatedAt: serverTimestamp(),
  });

  // Mirror on user document
  await updateDoc(doc(db, 'users', recyclerId), {
    verificationStatus: status,
    updatedAt: serverTimestamp(),
  });
}

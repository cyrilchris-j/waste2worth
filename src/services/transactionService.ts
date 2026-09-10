import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction, TransactionStatus } from '../types';

// ─────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────

function generateTransactionId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `TXN-${year}-${rand}`;
}

// ─────────────────────────────────────────────
// CHECK DUPLICATE
// ─────────────────────────────────────────────

export async function transactionExistsForLot(lotId: string): Promise<boolean> {
  const q = query(collection(db, 'transactions'), where('lotId', '==', lotId));
  const snap = await getDocs(q);
  return !snap.empty;
}

// ─────────────────────────────────────────────
// CREATE TRANSACTION (on lot acceptance)
// ─────────────────────────────────────────────

export async function createTransaction(data: {
  lotId: string;
  collectorId: string;
  recyclerId: string;
  offerId: string | null;
  agreedPrice: number;
  deliveryCost?: number;
  platformFee?: number;
  handoverAddress?: string;
}): Promise<string> {
  const deliveryCost = data.deliveryCost ?? 0;
  const platformFee  = data.platformFee  ?? Math.round(data.agreedPrice * 0.02); // 2% platform fee
  const totalAmount  = data.agreedPrice + deliveryCost + platformFee;

  const transactionId = generateTransactionId();

  await addDoc(collection(db, 'transactions'), {
    transactionId,
    lotId:        data.lotId,
    offerId:      data.offerId,
    collectorId:  data.collectorId,
    recyclerId:   data.recyclerId,

    agreedPrice:  data.agreedPrice,
    deliveryCost,
    platformFee,
    totalAmount,

    status:        'CREATED' as TransactionStatus,
    paymentStatus: 'PENDING',
    handoverStatus: 'PENDING',
    handoverMethod: null,
    handoverAddress: data.handoverAddress ?? '',
    scheduledDate: null,
    handoverEvidence: [],
    receivedWeightKg: null,
    confirmedAt: null,

    termsAccepted: true,
    termsAcceptedAt: serverTimestamp(),

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return transactionId;
}

// ─────────────────────────────────────────────
// GET TRANSACTION BY ID
// ─────────────────────────────────────────────

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  // transactionId is stored as field, so query
  const q = query(
    collection(db, 'transactions'),
    where('transactionId', '==', transactionId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...d.data() } as Transaction;
}

// ─────────────────────────────────────────────
// GET RECYCLER TRANSACTIONS
// ─────────────────────────────────────────────

export async function getRecyclerTransactions(recyclerId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, 'transactions'),
    where('recyclerId', '==', recyclerId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...d.data() } as Transaction));
}

// ─────────────────────────────────────────────
// UPDATE TRANSACTION STATUS
// ─────────────────────────────────────────────

export async function updateTransactionStatus(
  transactionId: string,
  updates: Partial<Pick<Transaction, 'status' | 'paymentStatus' | 'handoverStatus' | 'receivedWeightKg' | 'confirmedAt'>>
): Promise<void> {
  const q = query(
    collection(db, 'transactions'),
    where('transactionId', '==', transactionId)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error(`Transaction ${transactionId} not found`);
  const docRef = doc(db, 'transactions', snap.docs[0].id);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
}

// ─────────────────────────────────────────────
// CONFIRM RECEIPT
// ─────────────────────────────────────────────

export async function confirmReceipt(
  transactionId: string,
  receivedWeightKg: number
): Promise<void> {
  await updateTransactionStatus(transactionId, {
    status: 'RECEIVED',
    handoverStatus: 'COMPLETED',
    receivedWeightKg,
  });
}

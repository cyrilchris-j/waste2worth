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
import { db } from '../config/firebase';
import type { Transaction, TransactionStatus, AuditLog, AuditEventType } from '../types';
import { canTransition } from '../utils/engines';
import { LotStatus } from '../types/domain';
import { auditLogs } from '../data/seed';

// ─────────────────────────────────────────────
// LOCAL CACHE HELPERS
// ─────────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'waste2worth:transactions';

function getLocalTransactions(): Record<string, Transaction> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalTransaction(txn: Transaction) {
  try {
    const map = getLocalTransactions();
    map[txn.transactionId] = txn;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────
// AUDIT LOGGING HELPER
// ─────────────────────────────────────────────

export async function logAuditEvent(event: {
  lotId: string;
  transactionId?: string | null;
  actorId: string;
  actorRole: string;
  eventType: AuditEventType | string;
  metadata?: Record<string, unknown>;
}): Promise<AuditLog> {
  const auditLog: AuditLog = {
    eventId: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    lotId: event.lotId,
    transactionId: event.transactionId ?? null,
    actorId: event.actorId,
    actorRole: event.actorRole,
    eventType: event.eventType,
    timestamp: new Date().toISOString(),
    metadata: event.metadata ?? {},
  };

  // 1. Keep seed / in-memory array updated
  try {
    auditLogs.unshift(auditLog);
  } catch {
    // ignore
  }

  // 2. Persist to Firestore if available
  try {
    if (db) {
      await addDoc(collection(db, 'auditLogs'), {
        ...auditLog,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Could not write audit log to Firestore:', err);
  }

  return auditLog;
}

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
  try {
    const q = query(collection(db, 'transactions'), where('lotId', '==', lotId));
    const snap = await getDocs(q);
    if (!snap.empty) return true;
  } catch (err) {
    console.warn('Failed to check duplicate transaction in Firestore, checking local cache', err);
  }
  const localList = Object.values(getLocalTransactions());
  return localList.some((t) => t.lotId === lotId);
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

  const newTxn: Transaction = {
    transactionId,
    lotId:        data.lotId,
    offerId:      data.offerId,
    collectorId:  data.collectorId,
    recyclerId:   data.recyclerId,

    agreedPrice:  data.agreedPrice,
    deliveryCost,
    platformFee,
    totalAmount,

    status:        'ACCEPTED' as TransactionStatus,
    paymentStatus: 'PENDING',
    handoverStatus: 'PENDING',
    handoverMethod: null,
    handoverAddress: data.handoverAddress ?? '',
    scheduledDate: null,
    handoverEvidence: [],
    receivedWeightKg: null,
    confirmedAt: null,

    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString() as any,

    createdAt: new Date().toISOString() as any,
    updatedAt: new Date().toISOString() as any,
  };

  saveLocalTransaction(newTxn);

  try {
    await addDoc(collection(db, 'transactions'), {
      ...newTxn,
      termsAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not write transaction to Firestore, local cache saved', err);
  }

  // Audit event
  await logAuditEvent({
    lotId: data.lotId,
    transactionId,
    actorId: data.recyclerId,
    actorRole: 'RECYCLER',
    eventType: 'LOT_ACCEPTED',
    metadata: { agreedPrice: data.agreedPrice },
  });

  return transactionId;
}

// ─────────────────────────────────────────────
// GET TRANSACTION BY ID
// ─────────────────────────────────────────────

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('transactionId', '==', transactionId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = { ...d.data() } as Transaction;
      saveLocalTransaction(data);
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch transaction from Firestore, checking local cache', err);
  }
  const local = getLocalTransactions()[transactionId];
  return local || null;
}

// ─────────────────────────────────────────────
// GET TRANSACTION BY LOT ID (FIX 6)
// ─────────────────────────────────────────────

export async function getTransactionByLotId(lotId: string): Promise<Transaction | null> {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('lotId', '==', lotId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = { ...d.data() } as Transaction;
      saveLocalTransaction(data);
      return data;
    }
  } catch (err) {
    console.warn('Failed to query transaction by lotId from Firestore, checking local cache', err);
  }
  const localList = Object.values(getLocalTransactions());
  return localList.find((t) => t.lotId === lotId) || null;
}

// ─────────────────────────────────────────────
// GET RECYCLER TRANSACTIONS
// ─────────────────────────────────────────────

export async function getRecyclerTransactions(recyclerId: string): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('recyclerId', '==', recyclerId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const txns = snap.docs.map((d) => ({ ...d.data() } as Transaction));
      txns.forEach(saveLocalTransaction);
      return txns;
    }
  } catch (err) {
    console.warn('Failed to fetch recycler transactions from Firestore, checking local cache', err);
  }
  const localList = Object.values(getLocalTransactions());
  return localList.filter((t) => t.recyclerId === recyclerId);
}

// ─────────────────────────────────────────────
// UPDATE TRANSACTION STATUS
// ─────────────────────────────────────────────

export async function updateTransactionStatus(
  transactionId: string,
  updates: Partial<Pick<Transaction, 'status' | 'paymentStatus' | 'handoverStatus' | 'receivedWeightKg' | 'confirmedAt'>>
): Promise<void> {
  // Update local cache
  const localMap = getLocalTransactions();
  if (localMap[transactionId]) {
    localMap[transactionId] = { ...localMap[transactionId], ...updates };
    saveLocalTransaction(localMap[transactionId]);
  }

  try {
    const q = query(
      collection(db, 'transactions'),
      where('transactionId', '==', transactionId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = doc(db, 'transactions', snap.docs[0].id);
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    }
  } catch (err) {
    console.warn('Could not update transaction in Firestore, local cache used', err);
  }
}

// ─────────────────────────────────────────────
// ADVANCE TRANSACTION STATUS WITH STATE MACHINE & AUDIT (FIX 5)
// ─────────────────────────────────────────────

export async function advanceTransactionStatus(
  transactionId: string,
  targetStatus: LotStatus | string,
  actor: { actorId: string; actorRole: string },
  metadata?: Record<string, unknown>
): Promise<void> {
  const txn = await getTransactionById(transactionId);
  if (!txn) throw new Error(`Transaction ${transactionId} not found`);

  // Verify lifecycle transition validity via engines.ts state machine
  if (!canTransition(txn.status, targetStatus as LotStatus)) {
    throw new Error(`Invalid lifecycle transition: ${txn.status} -> ${targetStatus}`);
  }

  await updateTransactionStatus(transactionId, {
    status: targetStatus as TransactionStatus,
  });

  // Map to corresponding audit event
  let eventType: AuditEventType | string = 'TRANSACTION_UPDATED';
  if (targetStatus === 'PROCESSING') eventType = 'PROCESSING_STARTED';
  else if (targetStatus === 'REPORT_PENDING') eventType = 'PROCESSING_REPORT_SUBMITTED';
  else if (targetStatus === 'COMPLETED') eventType = 'LOT_COMPLETED';
  else if (targetStatus === 'PAID') eventType = 'PAYMENT_COMPLETED';
  else if (targetStatus === 'PAYMENT_PENDING') eventType = 'PAYMENT_INITIATED';
  else if (targetStatus === 'RECEIVED') eventType = 'MATERIAL_RECEIVED';
  else if (targetStatus === 'HANDED_OVER') eventType = 'HANDOVER_CONFIRMED';
  else if (targetStatus === 'ACCEPTED') eventType = 'LOT_ACCEPTED';

  await logAuditEvent({
    lotId: txn.lotId,
    transactionId: txn.transactionId,
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    eventType,
    metadata: {
      fromStatus: txn.status,
      toStatus: targetStatus,
      ...metadata,
    },
  });
}

// ─────────────────────────────────────────────
// CONFIRM RECEIPT
// ─────────────────────────────────────────────

export async function confirmReceipt(
  transactionId: string,
  receivedWeightKg: number,
  actor?: { actorId: string; actorRole: string }
): Promise<void> {
  const txn = await getTransactionById(transactionId);
  if (!txn) throw new Error(`Transaction ${transactionId} not found`);

  // If status is PAID or HANDOVER_PENDING, advance to HANDED_OVER first if valid
  if (canTransition(txn.status, LotStatus.HANDED_OVER)) {
    await advanceTransactionStatus(transactionId, LotStatus.HANDED_OVER, actor || { actorId: txn.recyclerId, actorRole: 'RECYCLER' });
  }

  await updateTransactionStatus(transactionId, {
    status: 'RECEIVED',
    handoverStatus: 'COMPLETED',
    receivedWeightKg,
  });

  await logAuditEvent({
    lotId: txn.lotId,
    transactionId,
    actorId: actor?.actorId || txn.recyclerId,
    actorRole: actor?.actorRole || 'RECYCLER',
    eventType: 'MATERIAL_RECEIVED',
    metadata: { receivedWeightKg },
  });
}

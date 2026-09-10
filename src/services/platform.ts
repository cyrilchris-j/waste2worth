import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { AuditLog, HandoverRecord, Offer, Payment, PriceReference, SafetyGuide, Transaction } from '../types/domain'
import { auditLogs, priceReferences, safetyGuides } from '../data/seed'

async function append<T extends object>(name: string, value: T) { if (!db) return { id: crypto.randomUUID(), ...value }; return addDoc(collection(db, name), { ...value, createdAt: serverTimestamp() }) }
export const priceReferenceService = { list: async (): Promise<PriceReference[]> => priceReferences }
export const offerService = { create: (offer: Offer) => append('offers', offer) }
export const transactionService = { create: (transaction: Transaction) => append('transactions', transaction) }
export const paymentService = { create: (payment: Payment) => append('payments', payment) }
export const handoverService = { create: (handover: HandoverRecord) => append('handoverRecords', handover) }
export const auditLogService = { list: async (): Promise<AuditLog[]> => auditLogs, append: (log: AuditLog) => append('auditLogs', log) }
export const safetyGuideService = { list: async (): Promise<SafetyGuide[]> => safetyGuides }

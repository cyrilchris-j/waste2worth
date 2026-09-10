import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { AuditLog, CollectorProfile, HandoverRecord, Lot, Offer, Payment, PriceReference, ProcessingReport, RecyclerProfile, SafetyGuide, Transaction, User } from '../types/domain'
import { auditLogs, priceReferences, safetyGuides } from '../data/seed'

async function append<T extends object>(name: string, value: T) { if (!db) return { id: crypto.randomUUID(), ...value }; return addDoc(collection(db, name), { ...value, createdAt: serverTimestamp() }) }
async function update<T extends object>(name: string, id: string, value: T) { if (!db) return { id, ...value }; return updateDoc(doc(db, name, id), { ...value, updatedAt: serverTimestamp() }) }
export const priceReferenceService = { list: async (): Promise<PriceReference[]> => priceReferences }
export const userService = { create: (user: User) => append('users', user), update: (userId: string, user: Partial<User>) => update('users', userId, user) }
export const collectorProfileService = { create: (profile: CollectorProfile) => append('collectorProfiles', profile), update: (collectorId: string, profile: Partial<CollectorProfile>) => update('collectorProfiles', collectorId, profile) }
export const recyclerProfileService = { create: (profile: RecyclerProfile) => append('recyclerProfiles', profile), update: (recyclerId: string, profile: Partial<RecyclerProfile>) => update('recyclerProfiles', recyclerId, profile) }
export const lotService = { create: (lot: Lot) => append('lots', lot), update: (lotId: string, lot: Partial<Lot>) => update('lots', lotId, lot) }
export const offerService = { create: (offer: Offer) => append('offers', offer) }
export const transactionService = { create: (transaction: Transaction) => append('transactions', transaction) }
export const paymentService = { create: (payment: Payment) => append('payments', payment) }
export const handoverService = { create: (handover: HandoverRecord) => append('handoverRecords', handover) }
export const processingReportService = { create: (report: ProcessingReport) => append('processingReports', report) }
export const auditLogService = { list: async (): Promise<AuditLog[]> => auditLogs, append: (log: AuditLog) => append('auditLogs', log) }
export const safetyGuideService = { list: async (): Promise<SafetyGuide[]> => safetyGuides }

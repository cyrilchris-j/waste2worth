export enum UserRole {
  COLLECTOR = 'COLLECTOR',
  RECYCLER = 'RECYCLER',
  ADMIN = 'ADMIN',
}

export enum LotStatus {
  DRAFT = 'DRAFT', LISTED = 'LISTED', MATCHED = 'MATCHED', ACCEPTED = 'ACCEPTED', PAID = 'PAID',
  HANDED_OVER = 'HANDED_OVER', RECEIVED = 'RECEIVED', PROCESSING = 'PROCESSING', COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED', DISPUTED = 'DISPUTED',
}

export enum VerificationStatus { PENDING = 'PENDING', UNDER_REVIEW = 'UNDER_REVIEW', VERIFIED = 'VERIFIED', REJECTED = 'REJECTED' }
export enum PaymentStatus { PENDING = 'PENDING', PAID = 'PAID', FAILED = 'FAILED' }
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
export type HandoverStatus = 'PENDING' | 'IN_TRANSIT' | 'HANDED_OVER' | 'RECEIVED'
export type PriceStatus = 'LOW' | 'NORMAL' | 'HIGH' | 'ABNORMAL'

export interface PriceReference { id: string; category: string; material: string; referencePrice: number; unit: string; sourceType: 'MOCK_REFERENCE'; sourceName: string; effectiveDate: string; createdAt: string; updatedAt: string }
export interface Lot { lotId: string; collectorId: string; category: string; conditionAssessment: string; components: string[]; quantity: number; estimatedWeight: number; askingPrice: number; evidence: string[]; location: string; status: LotStatus; createdAt: string; updatedAt: string }
export interface User { userId: string; role: UserRole; displayName: string; email?: string; createdAt: string; updatedAt: string }
export interface CollectorProfile { collectorId: string; userId: string; displayName: string; location: string; verificationStatus: VerificationStatus; createdAt: string; updatedAt: string }
export interface RecyclerProfile { recyclerId: string; userId?: string; facility: string; verificationStatus: VerificationStatus; acceptedMaterials: string[]; processingCapabilities: string[]; capacity: number; location: string }
export interface Offer { offerId: string; lotId: string; collectorId: string; recyclerId: string; offeredPrice: number; status: OfferStatus; createdAt: string; updatedAt: string }
export interface Transaction { transactionId: string; lotId: string; collectorId: string; recyclerId: string; offerId: string; materialSummary: string; amount: number; status: LotStatus | string; paymentStatus?: string; handoverStatus?: string; receivedWeightKg?: number; confirmedAt?: string; createdAt: string; updatedAt: string }
export interface Payment { paymentId: string; transactionId: string; amount: number; breakdown: { ewasteValue: number; delivery: number; platformFee: number; total: number }; method: 'MOCK'; status: PaymentStatus; createdAt: string; updatedAt: string }
export interface HandoverRecord { handoverId: string; transactionId: string; lotId: string; collectorId: string; recyclerId: string; status: HandoverStatus; deliveryDetails: string; timestamp: string; confirmationReference: string }
export interface ProcessingReport { processingReportId: string; transactionId: string; lotId: string; recyclerId: string; receivedWeight: number; processedWeight: number; processingType: string; recoveredMaterials: string[]; residualQuantity: number; processingDate: string; notes: string; evidence: string[]; createdAt: string; updatedAt: string }
export type AuditEventType = 'LOT_CREATED' | 'LOT_LISTED' | 'PRICE_EVALUATED' | 'MATCH_CREATED' | 'OFFER_CREATED' | 'LOT_ACCEPTED' | 'PAYMENT_INITIATED' | 'PAYMENT_COMPLETED' | 'HANDOVER_CONFIRMED' | 'MATERIAL_RECEIVED' | 'PROCESSING_STARTED' | 'PROCESSING_REPORT_SUBMITTED' | 'LOT_COMPLETED'
export interface AuditLog { eventId: string; lotId: string; transactionId: string | null; actorId: string; actorRole: UserRole; eventType: AuditEventType; timestamp: string; metadata?: Record<string, unknown> }
export interface PriceEvaluation { referenceRange: [number, number]; suggestedFairValueRange: [number, number]; askingPrice: number; deviationPercentage: number; priceStatus: PriceStatus; reason: string; priceFlag: boolean; referencePrice: number }
export interface MatchResult { recycler: RecyclerProfile; compatibilityScore: number; reasons: string[] }
export interface SafetyGuide { title: string; category: string; icon: string; instructions: string[]; warnings: string[] }

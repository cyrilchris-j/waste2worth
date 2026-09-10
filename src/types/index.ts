import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────
// ENUMS / UNION TYPES
// ─────────────────────────────────────────────

export type UserRole = 'COLLECTOR' | 'RECYCLER' | 'ADMIN';

export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export type LotStatus =
  | 'DRAFT'
  | 'LISTED'
  | 'ACCEPTED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'HANDOVER_PENDING'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'REPORT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type TransactionStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'HANDOVER_PENDING'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'REPORT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type ProcessingReportStatus = 'REPORT_PENDING' | 'PROCESSING' | 'COMPLETED';

export type PaymentStatus = 'PENDING' | 'INITIATED' | 'CONFIRMED' | 'FAILED';

export type HandoverStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED';

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

// ─────────────────────────────────────────────
// E-WASTE CATEGORIES
// ─────────────────────────────────────────────

export const E_WASTE_CATEGORIES = [
  'Laptop',
  'Desktop / Computer',
  'Mobile / Smartphone',
  'Tablet',
  'Monitor / Display',
  'Printer / Scanner',
  'Television',
  'Refrigerator',
  'Air Conditioner',
  'Washing Machine',
  'PCB / Circuit Board',
  'Cable / Wire',
  'Battery',
  'Keyboard / Mouse',
  'Charger / Adapter',
  'Hard Drive / Storage',
  'Camera',
  'Audio Equipment',
  'Networking Equipment',
  'Mixed E-Waste',
  'Other',
] as const;

export type EWasteCategory = (typeof E_WASTE_CATEGORIES)[number];

// ─────────────────────────────────────────────
// PROCESSING CAPABILITIES
// ─────────────────────────────────────────────

export const PROCESSING_CAPABILITIES = [
  'Component Recovery',
  'Material Recovery',
  'Refurbishment',
  'Data Destruction',
  'Battery Recycling',
  'CRT Processing',
  'PCB Recycling',
  'Precious Metal Recovery',
  'Plastic Recovery',
  'Cable Processing',
  'Other Permitted Processing',
] as const;

export type ProcessingCapability = (typeof PROCESSING_CAPABILITIES)[number];

// ─────────────────────────────────────────────
// RECOVERED MATERIAL CATEGORIES
// ─────────────────────────────────────────────

export const RECOVERED_MATERIALS = [
  'Copper',
  'Aluminium',
  'Steel / Iron',
  'Gold',
  'Silver',
  'PCB / Circuit Board',
  'Plastic',
  'Glass',
  'Battery Material',
  'Other',
] as const;

export type RecoveredMaterial = (typeof RECOVERED_MATERIALS)[number];

// ─────────────────────────────────────────────
// CONDITION
// ─────────────────────────────────────────────

export type OverallCondition =
  | 'Working'
  | 'Partially Working'
  | 'Non-Working'
  | 'Damaged'
  | 'For Parts'
  | 'Unknown';

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

/** Stored in Firestore: users/{userId} */
export interface User {
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// RECYCLER PROFILE
// ─────────────────────────────────────────────

/** Stored in Firestore: recyclerProfiles/{userId} */
export interface RecyclerProfile {
  recyclerId: string;          // same as userId
  userId: string;
  companyName: string;
  facilityName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;

  // Authorization
  registrationNumber: string;
  authorizationBody: string;   // e.g. "CPCB", "State PCB", etc.
  authorizationNumber: string;
  authorizationValidUntil: string;   // ISO date string
  authorizationDocumentRef: string;  // URL or reference to uploaded doc

  // Capabilities
  acceptedCategories: EWasteCategory[];
  processingCapabilities: ProcessingCapability[];
  processingCapacityKgPerMonth: number;

  // Platform
  verificationStatus: VerificationStatus;
  verificationNotes: string;
  verifiedAt: Timestamp | null;
  verifiedBy: string | null;   // admin userId

  // Terms
  termsAccepted: boolean;
  termsAcceptedAt: Timestamp | null;
  platformTermsAccepted: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// COLLECTOR PROFILE (shared type, owned by Ashok)
// ─────────────────────────────────────────────

/** Stored in Firestore: collectorProfiles/{userId} */
export interface CollectorProfile {
  collectorId: string;
  userId: string;
  name: string;
  phone: string;
  location: string;
  city: string;
  state: string;
  collectorType: string;
  verificationStatus: VerificationStatus;
  termsAcceptedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// EVIDENCE
// ─────────────────────────────────────────────

export interface Evidence {
  evidenceId: string;
  type: 'FRONT' | 'BACK' | 'COMPONENT' | 'DAMAGE' | 'LABEL' | 'FACILITY' | 'PROCESSING' | 'OUTPUT' | 'OTHER';
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

// ─────────────────────────────────────────────
// E-WASTE LOT
// ─────────────────────────────────────────────

/** Stored in Firestore: lots/{lotId} */
export interface Lot {
  lotId: string;                  // e.g. EW-2026-000127
  collectorId: string;
  collectorName?: string;          // limited info shown to recycler
  collectorCity?: string;

  // Item details
  category: EWasteCategory;
  brand: string;
  model: string;
  quantity: number;
  estimatedWeightKg: number;
  condition: OverallCondition;
  componentNotes: string;

  // Pricing
  askingPrice: number;             // ₹
  platformReferenceMin: number;
  platformReferenceMax: number;
  priceStatus: 'WITHIN_RANGE' | 'ABOVE_RANGE' | 'BELOW_RANGE' | 'NO_REFERENCE';

  // Evidence
  evidence: Evidence[];

  // Location (for matching — no exact address until transaction)
  city: string;
  state: string;

  // Status
  status: LotStatus;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  listedAt: Timestamp | null;
}

// ─────────────────────────────────────────────
// OFFER
// ─────────────────────────────────────────────

/** Stored in Firestore: offers/{offerId} */
export interface Offer {
  offerId: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  offeredPrice: number;
  status: OfferStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// TRANSACTION
// ─────────────────────────────────────────────

/** Stored in Firestore: transactions/{transactionId} */
export interface Transaction {
  transactionId: string;          // e.g. TXN-2026-000184
  lotId: string;
  offerId: string | null;
  collectorId: string;
  recyclerId: string;

  // Financial
  agreedPrice: number;
  deliveryCost: number;
  platformFee: number;
  totalAmount: number;

  // Status
  status: TransactionStatus;
  paymentStatus: PaymentStatus;
  handoverStatus: HandoverStatus;

  // Handover
  handoverMethod: 'RECYCLER_PICKUP' | 'COLLECTOR_DELIVERY' | 'DIRECT_HANDOVER' | null;
  handoverAddress: string;
  scheduledDate: string | null;
  handoverEvidence: Evidence[];
  receivedWeightKg: number | null;
  confirmedAt: Timestamp | null;

  // Terms acceptance (recycler)
  termsAccepted: boolean;
  termsAcceptedAt: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// PROCESSING REPORT
// ─────────────────────────────────────────────

export interface RecoveredMaterialEntry {
  material: RecoveredMaterial;
  quantityKg: number;
}

/** Stored in Firestore: processingReports/{processingReportId} */
export interface ProcessingReport {
  processingReportId: string;
  transactionId: string;
  lotId: string;
  recyclerId: string;

  receivedWeightKg: number;
  processedWeightKg: number;
  residualWeightKg: number;
  processingMethod: ProcessingCapability;
  processingDate: string;           // ISO date string
  recoveredMaterials: RecoveredMaterialEntry[];
  notes: string;

  evidence: Evidence[];

  status: ProcessingReportStatus;
  submittedAt: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

/** Stored in Firestore: auditLogs/{logId} */
export interface AuditLog {
  logId: string;
  entityType: 'LOT' | 'TRANSACTION' | 'PROCESSING_REPORT' | 'USER' | 'RECYCLER_PROFILE';
  entityId: string;
  action: string;
  performedBy: string;
  performedByRole: UserRole;
  details: Record<string, unknown>;
  timestamp: Timestamp;
}

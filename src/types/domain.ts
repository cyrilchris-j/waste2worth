// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL DOMAIN MODEL & SHARED TYPES — waste2worth Platform
// ─────────────────────────────────────────────────────────────────────────────

export const UserRole = {
  COLLECTOR: 'COLLECTOR',
  RECYCLER: 'RECYCLER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole] | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';
export type UserRoleType = UserRole;

export const LotStatus = {
  DRAFT: 'DRAFT',
  LISTED: 'LISTED',
  MATCHED: 'MATCHED',
  ACCEPTED: 'ACCEPTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAID: 'PAID',
  HANDOVER_PENDING: 'HANDOVER_PENDING',
  HANDED_OVER: 'HANDED_OVER',
  RECEIVED: 'RECEIVED',
  PROCESSING: 'PROCESSING',
  REPORT_PENDING: 'REPORT_PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  DISPUTED: 'DISPUTED',
} as const;
export type LotStatus = (typeof LotStatus)[keyof typeof LotStatus] | string;
export type LotStatusType = LotStatus;

export const VerificationStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus] | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type VerificationStatusType = VerificationStatus;

export const PaymentStatus = {
  PENDING: 'PENDING',
  INITIATED: 'INITIATED',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus] | string;
export type PaymentStatusType = PaymentStatus;

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type HandoverStatus = 'PENDING' | 'IN_TRANSIT' | 'HANDOVER_PENDING' | 'HANDED_OVER' | 'RECEIVED';
export type PriceStatus = 'LOW' | 'NORMAL' | 'HIGH' | 'ABNORMAL';
export type SyncStatus = 'OFFLINE' | 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR';

export type Category =
  | 'Laptop'
  | 'Mobile Phone'
  | 'Battery'
  | 'PCB'
  | 'Cable'
  | 'Display'
  | 'Desktop'
  | 'Other'
  | string;

export const E_WASTE_CATEGORIES = [
  'SMARTPHONE',
  'FEATURE_PHONE',
  'LAPTOP',
  'DESKTOP',
  'TABLET',
  'CRT_MONITOR',
  'LCD_LED_MONITOR',
  'TELEVISION',
  'PRINTER_SCANNER',
  'NETWORKING',
  'SERVER',
  'LI_ION_BATTERY',
  'LEAD_ACID_BATTERY',
  'OTHER_BATTERY',
  'PCB_BOARDS',
  'MIXED_CABLES',
  'POWER_SUPPLY',
  'MISCELLANEOUS_IT',
] as const;

export type EWasteCategory =
  | (typeof E_WASTE_CATEGORIES)[number]
  | 'LARGE_APPLIANCES'
  | 'SMALL_APPLIANCES'
  | 'IT_TELECOM'
  | 'CONSUMER_ELECTRONICS'
  | 'LIGHTING'
  | 'ELECTRICAL_TOOLS'
  | 'TOYS_LEISURE'
  | 'MEDICAL_DEVICES'
  | 'MONITORING_CONTROL'
  | 'AUTOMATIC_DISPENSERS'
  | 'BATTERIES'
  | 'SOLAR_PANELS'
  | 'OTHER'
  | Category
  | string;

export const PROCESSING_CAPABILITIES = [
  'MANUAL_DISMANTLING',
  'MECHANICAL_SHREDDING',
  'PCB_DEPOPULATION',
  'HYDROMETALLURGICAL_REFINING',
  'BATTERY_RECYCLING',
  'PLASTIC_GRANULATION',
  'PRECIOUS_METAL_RECOVERY',
  'HAZARDOUS_TREATMENT',
] as const;

export type ProcessingCapability = (typeof PROCESSING_CAPABILITIES)[number] | string;

export const RECOVERED_MATERIALS = [
  'Copper',
  'Aluminium',
  'Iron / Steel',
  'Gold (trace)',
  'Silver (trace)',
  'Palladium (trace)',
  'Plastics (ABS/PC)',
  'Lithium',
  'Cobalt',
  'Lead',
  'Glass',
  'Hazardous Residue',
  'Other',
] as const;

export type RecoveredMaterial = (typeof RECOVERED_MATERIALS)[number] | string;

export interface RecoveredMaterialEntry {
  material: RecoveredMaterial;
  quantityKg: number;
}

export type OverallCondition =
  | 'Working'
  | 'Partially Working'
  | 'Non-Working'
  | 'Damaged'
  | 'For Parts'
  | 'Unknown'
  | string;

export type ProcessingReportStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | string;

export interface Evidence {
  evidenceId?: string;
  id?: string;
  type?: string;
  url: string;
  thumbnailUrl?: string;
  storagePath?: string;
  fileName?: string;
  uploadedAt?: any;
  uploadedBy?: string;
}

export type TransactionStatus =
  | 'INITIATED'
  | 'CREATED'
  | 'OFFER_ACCEPTED'
  | 'ACCEPTED'
  | 'PAYMENT_ESCROWED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'HANDOVER_SCHEDULED'
  | 'HANDOVER_PENDING'
  | 'IN_TRANSIT'
  | 'HANDED_OVER'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'REPORT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | LotStatus
  | string;

// ─── COLLECTOR RICH STRUCTURES ───────────────────────────────────────────────

export interface ConditionAssessment {
  working: 'WORKING' | 'NOT_WORKING' | 'UNKNOWN' | string;
  physicalDamage?: boolean;
  waterDamage?: boolean;
  batteryCondition?: 'GOOD' | 'DEGRADED' | 'SWOLLEN' | 'NOT_APPLICABLE' | 'UNKNOWN' | string;
  missingComponents?: string;
  brokenDisplay?: boolean;
  otherDefects?: string;
}

export interface LotComponents {
  present: string;
  missing: string;
  reusable: string;
  hazardous: string;
}

export interface EvidenceReference {
  id: string;
  name: string;
  type: string;
  size: number;
  storagePath?: string;
  downloadUrl?: string;
  dataUrl?: string;
  createdAt: string;
}

export interface LotItem {
  name: string;
  quantity: number;
  condition: string;
  workingCondition?: 'WORKING' | 'NOT_WORKING' | 'PARTIAL';
}

// ─── CORE PLATFORM ENTITIES ──────────────────────────────────────────────────

export interface User {
  userId: string;
  role: UserRole | UserRoleType;
  displayName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  verificationStatus?: VerificationStatus | string;
  createdAt: any;
  updatedAt?: any;
}

export interface AppUser {
  userId: string;
  role: UserRole | UserRoleType;
  email: string;
  fullName: string;
}

export interface CollectorProfile {
  collectorId: string;
  userId?: string;
  displayName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  location: string;
  collectorType?: string;
  organization?: string;
  termsAccepted?: boolean;
  participationTermsAccepted?: boolean;
  status?: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | VerificationStatus | string;
  verificationStatus?: VerificationStatus | string;
  createdAt: string;
  updatedAt?: string;
  totalLots?: number;
  completedLots?: number;
  earnings?: number;
}

export interface RecyclerProfile {
  recyclerId: string;
  userId?: string;
  companyName?: string;
  facilityName?: string;
  facility?: string;
  organizationName?: string;
  facilityAddress?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  registrationNumber?: string;
  authorizationBody?: string;
  authorizationNumber?: string;
  authorizationValidUntil?: string;
  authorizationDocumentRef?: string;
  spcbRegNumber?: string;
  cpcbRegistrationNo?: string;
  cpcbValidityDate?: string;
  verificationStatus: VerificationStatus | string;
  verificationNotes?: string;
  verifiedAt?: any;
  verifiedBy?: string | null;
  acceptedMaterials?: string[];
  acceptedCategories?: (EWasteCategory | Category | string)[];
  processingCapabilities?: (ProcessingCapability | string)[];
  capacity?: number;
  dailyCapacityKg?: number;
  processingCapacityKgPerMonth?: number;
  termsAccepted?: boolean;
  termsAcceptedAt?: any;
  platformTermsAccepted?: boolean;
  complianceDeclaration?: boolean;
  location?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Lot {
  lotId: string;
  collectorId: string;
  collectorName?: string;
  collectorCity?: string;
  clientOperationId?: string;
  category: Category | EWasteCategory | string;
  brand?: string;
  model?: string;
  condition?: OverallCondition | string | ConditionAssessment;
  conditionAssessment?: ConditionAssessment | string;
  components?: LotComponents | string[];
  componentNotes?: string;
  items?: LotItem[];
  quantity?: number;
  estimatedWeight?: number;
  estimatedWeightKg?: number;
  unit?: 'kg' | 'units' | string;
  askingPrice: number;
  referencePrice?: number;
  platformReferenceMin?: number;
  platformReferenceMax?: number;
  priceStatus?: 'WITHIN_RANGE' | 'ABOVE_RANGE' | 'BELOW_RANGE' | 'NO_REFERENCE' | string;
  evidence?: (Evidence | EvidenceReference | string)[];
  photos?: string[];
  city?: string;
  state?: string;
  location?: string;
  status: LotStatus | string;
  syncStatus?: SyncStatus;
  notes?: string;
  acceptedBy?: string;
  assignedRecyclerId?: string;
  transactionId?: string;
  createdAt: any;
  updatedAt: any;
  listedAt?: any;
}

export interface LotDraft {
  category: Category | EWasteCategory | '';
  conditionAssessment: ConditionAssessment;
  components: LotComponents;
  quantity: string;
  estimatedWeight: string;
  unit: 'kg' | 'units';
  askingPrice: string;
  evidence: EvidenceReference[];
  location: string;
  notes: string;
}

export interface Offer {
  offerId: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  offeredPrice: number;
  status: OfferStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Transaction {
  transactionId: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  offerId?: string | null;
  materialSummary?: string;
  amount?: number;
  agreedPrice?: number;
  deliveryCost?: number;
  platformFee?: number;
  totalAmount?: number;
  status: LotStatus | TransactionStatus | string;
  paymentStatus?: PaymentStatus | string;
  handoverStatus?: HandoverStatus | string;
  handoverMethod?: 'RECYCLER_PICKUP' | 'COLLECTOR_DELIVERY' | 'DIRECT_HANDOVER' | string | null;
  handoverAddress?: string;
  scheduledDate?: string | null;
  handoverEvidence?: (Evidence | string)[];
  handoverOtp?: string;
  receivedWeightKg?: number | null;
  confirmedAt?: any;
  termsAccepted?: boolean;
  termsAcceptedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Payment {
  paymentId: string;
  transactionId: string;
  amount: number;
  breakdown: {
    ewasteValue: number;
    delivery: number;
    platformFee: number;
    total: number;
  };
  method: 'MOCK' | 'ESCROW' | 'BANK_TRANSFER' | string;
  status: PaymentStatus | string;
  createdAt: any;
  updatedAt: any;
}

export interface HandoverRecord {
  handoverId: string;
  transactionId: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  status: HandoverStatus;
  deliveryDetails: string;
  timestamp: string;
  confirmationReference: string;
}

export interface ProcessingReport {
  processingReportId: string;
  transactionId: string;
  lotId: string;
  recyclerId: string;
  receivedWeight?: number;
  processedWeight?: number;
  inputWeightKg?: number;
  receivedWeightKg?: number;
  processedWeightKg?: number;
  residualWeightKg?: number;
  processingMethod?: ProcessingCapability | string;
  processingType?: string;
  recoveredMaterials?: RecoveredMaterialEntry[] | string[] | any;
  residualQuantity?: number;
  hazardousWasteHandled?: string[];
  disposalPartner?: string;
  landfillDiversionPercent?: number;
  processingDate: string;
  notes?: string;
  evidence?: (Evidence | string)[];
  certificates?: string[];
  status?: ProcessingReportStatus | string;
  submittedAt?: any;
  createdAt: any;
  updatedAt: any;
}

// ─── PLATFORM INTELLIGENCE & AUDIT ───────────────────────────────────────────

export type AuditEventType =
  | 'LOT_CREATED'
  | 'LOT_LISTED'
  | 'PRICE_EVALUATED'
  | 'MATCH_CREATED'
  | 'OFFER_CREATED'
  | 'LOT_ACCEPTED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'HANDOVER_CONFIRMED'
  | 'MATERIAL_RECEIVED'
  | 'PROCESSING_STARTED'
  | 'PROCESSING_REPORT_SUBMITTED'
  | 'LOT_COMPLETED';

export interface AuditLog {
  eventId: string;
  lotId: string;
  transactionId: string | null;
  actorId: string;
  actorRole: UserRole | string;
  eventType: AuditEventType | string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PriceReference {
  id: string;
  category: string;
  material: string;
  referencePrice: number;
  unit: string;
  sourceType: 'MOCK_REFERENCE' | 'OFFICIAL' | string;
  sourceName: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceEvaluation {
  referenceRange: [number, number];
  suggestedFairValueRange: [number, number];
  askingPrice: number;
  deviationPercentage: number;
  priceStatus: PriceStatus;
  reason: string;
  priceFlag: boolean;
  referencePrice: number;
}

export interface MatchResult {
  recycler: RecyclerProfile;
  compatibilityScore: number;
  reasons: string[];
}

export interface SafetyGuide {
  title: string;
  category: string;
  icon: string;
  instructions: string[];
  warnings: string[];
}

// ─── INITIAL CONSTANTS ───────────────────────────────────────────────────────

export const emptyCondition: ConditionAssessment = {
  working: 'UNKNOWN',
  physicalDamage: false,
  waterDamage: false,
  batteryCondition: 'UNKNOWN',
  missingComponents: '',
  brokenDisplay: false,
  otherDefects: '',
};

export const emptyComponents: LotComponents = {
  present: '',
  missing: '',
  reusable: '',
  hazardous: '',
};

export const categories: Category[] = [
  'Laptop',
  'Mobile Phone',
  'Battery',
  'PCB',
  'Cable',
  'Display',
  'Desktop',
  'Other',
];

export const statuses: LotStatusType[] = [
  'DRAFT',
  'LISTED',
  'MATCHED',
  'ACCEPTED',
  'PAID',
  'HANDED_OVER',
  'RECEIVED',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
];

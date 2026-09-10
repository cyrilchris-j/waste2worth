export type UserRole = 'COLLECTOR' | 'RECYCLER' | 'ADMIN'

export type LotStatus = 'DRAFT' | 'LISTED' | 'ACCEPTED' | 'PAID' | 'HANDED_OVER' | 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
export type SyncStatus = 'OFFLINE' | 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR'
export type Category = 'Laptop' | 'Mobile Phone' | 'Battery' | 'PCB' | 'Cable' | 'Display' | 'Desktop' | 'Other'

export interface ConditionAssessment {
  working: 'WORKING' | 'NOT_WORKING' | 'UNKNOWN'
  physicalDamage: boolean
  waterDamage: boolean
  batteryCondition: 'GOOD' | 'DEGRADED' | 'SWOLLEN' | 'NOT_APPLICABLE' | 'UNKNOWN'
  missingComponents: string
  brokenDisplay: boolean
  otherDefects: string
}

export interface LotComponents {
  present: string
  missing: string
  reusable: string
  hazardous: string
}

export interface EvidenceReference {
  id: string
  name: string
  type: string
  size: number
  storagePath?: string
  downloadUrl?: string
  dataUrl?: string
  createdAt: string
}

export interface Lot {
  lotId: string
  clientOperationId: string
  collectorId: string
  category: Category
  conditionAssessment: ConditionAssessment
  components: LotComponents
  quantity: number
  estimatedWeight: number
  unit: 'kg' | 'units'
  askingPrice: number
  evidence: EvidenceReference[]
  location: string
  status: LotStatus
  createdAt: string
  updatedAt: string
  syncStatus?: SyncStatus
  notes?: string
}

export interface CollectorProfile {
  collectorId: string
  fullName: string
  phone: string
  email: string
  location: string
  collectorType: string
  organization?: string
  termsAccepted: boolean
  participationTermsAccepted: boolean
  status: 'PENDING' | 'VERIFIED' | 'SUSPENDED'
  createdAt: string
  totalLots?: number
  completedLots?: number
  earnings?: number
}

export interface AppUser {
  userId: string
  role: UserRole
  email: string
  fullName: string
}

export interface LotDraft {
  category: Category | ''
  conditionAssessment: ConditionAssessment
  components: LotComponents
  quantity: string
  estimatedWeight: string
  unit: 'kg' | 'units'
  askingPrice: string
  evidence: EvidenceReference[]
  location: string
  notes: string
}

export const emptyCondition: ConditionAssessment = {
  working: 'UNKNOWN', physicalDamage: false, waterDamage: false,
  batteryCondition: 'UNKNOWN', missingComponents: '', brokenDisplay: false, otherDefects: ''
}

export const emptyComponents: LotComponents = { present: '', missing: '', reusable: '', hazardous: '' }
export const categories: Category[] = ['Laptop', 'Mobile Phone', 'Battery', 'PCB', 'Cable', 'Display', 'Desktop', 'Other']
export const statuses: LotStatus[] = ['DRAFT', 'LISTED', 'ACCEPTED', 'PAID', 'HANDED_OVER', 'RECEIVED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'DISPUTED']

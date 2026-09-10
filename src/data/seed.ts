import { LotStatus, UserRole, VerificationStatus, type PriceReference, type Lot, type RecyclerProfile, type SafetyGuide, type AuditLog } from '../types/domain'

export const priceReferences: PriceReference[] = [
  { id: 'ref-laptop', category: 'Laptop', material: 'Mixed laptop', referencePrice: 240, unit: 'per kg', sourceType: 'MOCK_REFERENCE', sourceName: 'Waste2Worth demo reference', effectiveDate: '2026-09-01', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
  { id: 'ref-pcb', category: 'PCB', material: 'Low-grade PCB', referencePrice: 520, unit: 'per kg', sourceType: 'MOCK_REFERENCE', sourceName: 'Waste2Worth demo reference', effectiveDate: '2026-09-01', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
  { id: 'ref-cable', category: 'Cable', material: 'Copper cable', referencePrice: 180, unit: 'per kg', sourceType: 'MOCK_REFERENCE', sourceName: 'Waste2Worth demo reference', effectiveDate: '2026-09-01', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
]
export const demoLot: Lot = { lotId: 'LOT-2026-0910-014', collectorId: 'collector-demo', category: 'Laptop', conditionAssessment: 'Mixed working and damaged units', components: ['Battery', 'PCB', 'Display'], quantity: 12, estimatedWeight: 35, askingPrice: 8500, evidence: ['demo-photo'], location: 'Chennai, Tamil Nadu', status: LotStatus.MATCHED, createdAt: '2026-09-10T08:30:00Z', updatedAt: '2026-09-10T10:10:00Z' }
export const recyclers: RecyclerProfile[] = [
  { recyclerId: 'recycler-greenloop', facility: 'GreenLoop Materials', verificationStatus: VerificationStatus.VERIFIED, acceptedMaterials: ['Laptop', 'PCB', 'Cable'], processingCapabilities: ['Dismantling', 'Battery isolation', 'Material recovery'], capacity: 80, location: 'Chennai, Tamil Nadu' },
  { recyclerId: 'recycler-circulab', facility: 'CircuLab Works', verificationStatus: VerificationStatus.UNDER_REVIEW, acceptedMaterials: ['Laptop', 'Display'], processingCapabilities: ['Dismantling', 'Component sorting'], capacity: 30, location: 'Bengaluru, Karnataka' },
  { recyclerId: 'recycler-ecoforge', facility: 'EcoForge Recovery', verificationStatus: VerificationStatus.VERIFIED, acceptedMaterials: ['Cable', 'PCB'], processingCapabilities: ['Material recovery'], capacity: 120, location: 'Coimbatore, Tamil Nadu' },
]
export const auditLogs: AuditLog[] = [
  { eventId: 'evt-1', lotId: demoLot.lotId, actorId: demoLot.collectorId, actorRole: UserRole.COLLECTOR, eventType: 'LOT_CREATED', timestamp: demoLot.createdAt },
  { eventId: 'evt-2', lotId: demoLot.lotId, actorId: demoLot.collectorId, actorRole: UserRole.COLLECTOR, eventType: 'LOT_LISTED', timestamp: '2026-09-10T09:00:00Z' },
  { eventId: 'evt-3', lotId: demoLot.lotId, actorId: 'platform-engine', actorRole: UserRole.ADMIN, eventType: 'PRICE_EVALUATED', timestamp: '2026-09-10T09:05:00Z' },
  { eventId: 'evt-4', lotId: demoLot.lotId, actorId: 'platform-engine', actorRole: UserRole.ADMIN, eventType: 'MATCH_CREATED', timestamp: '2026-09-10T10:10:00Z' },
]
export const safetyGuides: SafetyGuide[] = [
  { title: 'Battery handling', category: 'Battery', icon: '🔋', instructions: ['Do not puncture, crush, or open batteries.', 'Tape exposed terminals before transport.', 'Keep batteries dry and separated.'], warnings: ['Stop handling swollen, hot, or leaking batteries.'] },
  { title: 'Laptop dismantling', category: 'Laptop', icon: '💻', instructions: ['Power down and disconnect chargers.', 'Remove batteries only with suitable tools.', 'Sort boards, cables, and casing separately.'], warnings: ['Wear eye protection and gloves.'] },
  { title: 'PCB sorting', category: 'PCB', icon: '▦', instructions: ['Keep boards dry and in rigid containers.', 'Avoid sanding or burning components.', 'Label unknown boards for assessment.'], warnings: ['Never burn e-waste to recover metals.'] },
  { title: 'Cable handling', category: 'Cable', icon: '〰', instructions: ['Bundle cables without tight knots.', 'Keep copper and mixed cable streams separate.', 'Use gloves when stripping is approved.'], warnings: ['Do not burn insulation.'] },
  { title: 'Display handling', category: 'Display', icon: '▣', instructions: ['Carry screens upright with two hands.', 'Use padding and avoid pressure on glass.', 'Keep broken panels sealed.'], warnings: ['Treat broken glass as a cut hazard.'] },
  { title: 'Damaged device', category: 'Damaged Device', icon: '⚠', instructions: ['Isolate heat, smoke, or swelling immediately.', 'Photograph damage from a safe distance.', 'Tell the receiving facility about hazards.'], warnings: ['Call local emergency services for fire or fumes.'] },
  { title: 'General handling', category: 'General Handling', icon: '♻', instructions: ['Wear gloves and closed shoes.', 'Wash hands after handling materials.', 'Use approved collection and recycling channels.'], warnings: ['Never mix e-waste with household waste.'] },
]

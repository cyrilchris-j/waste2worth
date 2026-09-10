import { LotStatus, VerificationStatus, type Lot, type PriceEvaluation, type PriceReference, type MatchResult, type RecyclerProfile } from '../types/domain'

export function evaluatePrice(
  lot: Pick<Lot, 'category' | 'askingPrice'> & { conditionAssessment?: any; condition?: any; estimatedWeight?: number; estimatedWeightKg?: number },
  reference: PriceReference
): PriceEvaluation {
  const weight = lot.estimatedWeight ?? lot.estimatedWeightKg ?? 1
  const referenceTotal = reference.referencePrice * weight
  const conditionStr = typeof lot.conditionAssessment === 'string'
    ? lot.conditionAssessment
    : typeof lot.condition === 'string'
      ? lot.condition
      : JSON.stringify(lot.conditionAssessment || '')
  const conditionFactor = /damaged|mixed/i.test(conditionStr) ? 0.8 : 1
  const fairLow = Math.round(referenceTotal * conditionFactor * 0.85)
  const fairHigh = Math.round(referenceTotal * conditionFactor * 1.15)
  const deviationPercentage = Math.round(((lot.askingPrice - fairHigh) / fairHigh) * 100)
  const priceStatus = lot.askingPrice < fairLow ? 'LOW' : lot.askingPrice > fairHigh * 1.25 ? 'ABNORMAL' : lot.askingPrice > fairHigh ? 'HIGH' : 'NORMAL'
  const reason = priceStatus === 'NORMAL' ? 'Asking price sits within the transparent fair-value range.' : priceStatus === 'LOW' ? 'Asking price is below the suggested fair-value range.' : `Asking price exceeds the reference range by ${Math.max(deviationPercentage, 0)}%. Platform guidance only; the original asking price is unchanged.`
  return { referenceRange: [Math.round(referenceTotal * 0.8), Math.round(referenceTotal * 1.1)], suggestedFairValueRange: [fairLow, fairHigh], askingPrice: lot.askingPrice, deviationPercentage, priceStatus, reason, priceFlag: priceStatus === 'HIGH' || priceStatus === 'ABNORMAL', referencePrice: referenceTotal }
}

export function scoreRecycler(
  lot: Pick<Lot, 'category' | 'askingPrice'> & { estimatedWeight?: number; estimatedWeightKg?: number; location?: string },
  recycler: RecyclerProfile,
  referenceTotal: number
): MatchResult {
  const lotWeight = lot.estimatedWeight ?? lot.estimatedWeightKg ?? 1
  const acceptedMaterials = recycler.acceptedMaterials || (recycler.acceptedCategories as string[]) || []
  const material = acceptedMaterials.includes(lot.category) ? 30 : 0
  const normalizedCategory = String(lot.category).toLowerCase()
  const processingCapabilities = (recycler.processingCapabilities as string[]) || []
  const capability = processingCapabilities.some(item => {
    const normalizedCapability = String(item).toLowerCase()
    return normalizedCapability.includes(normalizedCategory) || (normalizedCategory === 'laptop' && /electronics|dismantling|component/.test(normalizedCapability)) || (normalizedCategory === 'battery' && /battery|isolation/.test(normalizedCapability)) || (normalizedCategory === 'pcb' && /board|material recovery/.test(normalizedCapability))
  }) ? 20 : 0
  const capacityVal = recycler.capacity ?? recycler.processingCapacityKgPerMonth ?? recycler.dailyCapacityKg ?? 1000
  const capacity = capacityVal >= lotWeight ? 15 : 5
  const recyclerLoc = recycler.location || `${recycler.city || ''}, ${recycler.state || ''}`
  const lotLoc = lot.location || ''
  const location = recyclerLoc.split(',')[1]?.trim() === lotLoc.split(',')[1]?.trim() ? 15 : 7
  const price = referenceTotal > 0 && lot.askingPrice <= referenceTotal * 1.25 ? 10 : 4
  const verification = (recycler.verificationStatus === VerificationStatus.VERIFIED || recycler.verificationStatus === 'VERIFIED') ? 10 : 0
  const reasons = [material ? 'Material accepted' : 'Material needs review', capability ? 'Processing capability matched' : 'Processing capability needs review', capacity === 15 ? 'Capacity sufficient' : 'Capacity needs confirmation', location === 15 ? 'Location compatible' : 'Location may require logistics', price === 10 ? 'Price acceptable' : 'Price needs discussion', verification === 10 ? 'Platform verified' : 'Verification is not complete']
  return { recycler, compatibilityScore: material + capability + capacity + location + price + verification, reasons }
}

export const allowedTransitions: Record<LotStatus, LotStatus[]> = {
  [LotStatus.DRAFT]: [LotStatus.LISTED, LotStatus.CANCELLED],
  [LotStatus.LISTED]: [LotStatus.MATCHED, LotStatus.ACCEPTED, LotStatus.CANCELLED],
  [LotStatus.MATCHED]: [LotStatus.ACCEPTED, LotStatus.CANCELLED, LotStatus.DISPUTED],
  [LotStatus.ACCEPTED]: [LotStatus.PAID, LotStatus.PAYMENT_PENDING, LotStatus.CANCELLED, LotStatus.DISPUTED],
  [LotStatus.PAYMENT_PENDING]: [LotStatus.PAID, LotStatus.CANCELLED],
  [LotStatus.PAID]: [LotStatus.HANDED_OVER, LotStatus.HANDOVER_PENDING, LotStatus.DISPUTED],
  [LotStatus.HANDOVER_PENDING]: [LotStatus.HANDED_OVER, LotStatus.DISPUTED],
  [LotStatus.HANDED_OVER]: [LotStatus.RECEIVED, LotStatus.DISPUTED],
  [LotStatus.RECEIVED]: [LotStatus.PROCESSING, LotStatus.DISPUTED],
  [LotStatus.PROCESSING]: [LotStatus.COMPLETED, LotStatus.REPORT_PENDING, LotStatus.DISPUTED],
  [LotStatus.REPORT_PENDING]: [LotStatus.COMPLETED, LotStatus.DISPUTED],
  [LotStatus.COMPLETED]: [],
  [LotStatus.CANCELLED]: [],
  [LotStatus.REJECTED]: [],
  [LotStatus.DISPUTED]: [LotStatus.ACCEPTED, LotStatus.CANCELLED],
}

export function canTransition(from: LotStatus | string, to: LotStatus) {
  return (allowedTransitions[from as LotStatus] || []).includes(to)
}

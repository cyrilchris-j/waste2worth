import { LotStatus, VerificationStatus, type Lot, type PriceEvaluation, type PriceReference, type MatchResult, type RecyclerProfile } from '../types/domain'

export function evaluatePrice(lot: Pick<Lot, 'category' | 'conditionAssessment' | 'estimatedWeight' | 'askingPrice'>, reference: PriceReference): PriceEvaluation {
  const referenceTotal = reference.referencePrice * lot.estimatedWeight
  const conditionFactor = /damaged|mixed/i.test(lot.conditionAssessment) ? 0.8 : 1
  const fairLow = Math.round(referenceTotal * conditionFactor * 0.85)
  const fairHigh = Math.round(referenceTotal * conditionFactor * 1.15)
  const deviationPercentage = Math.round(((lot.askingPrice - fairHigh) / fairHigh) * 100)
  const priceStatus = lot.askingPrice < fairLow ? 'LOW' : lot.askingPrice > fairHigh * 1.25 ? 'ABNORMAL' : lot.askingPrice > fairHigh ? 'HIGH' : 'NORMAL'
  const reason = priceStatus === 'NORMAL' ? 'Asking price sits within the transparent fair-value range.' : priceStatus === 'LOW' ? 'Asking price is below the suggested fair-value range.' : `Asking price exceeds the reference range by ${Math.max(deviationPercentage, 0)}%. Platform guidance only; the original asking price is unchanged.`
  return { referenceRange: [Math.round(referenceTotal * 0.8), Math.round(referenceTotal * 1.1)], suggestedFairValueRange: [fairLow, fairHigh], askingPrice: lot.askingPrice, deviationPercentage, priceStatus, reason, priceFlag: priceStatus === 'HIGH' || priceStatus === 'ABNORMAL', referencePrice: referenceTotal }
}
export function scoreRecycler(lot: Pick<Lot, 'category' | 'estimatedWeight' | 'location' | 'askingPrice'>, recycler: RecyclerProfile, referenceTotal: number): MatchResult {
  const material = recycler.acceptedMaterials.includes(lot.category) ? 30 : 0
  const capability = recycler.processingCapabilities.length > 0 ? 20 : 0
  const capacity = recycler.capacity >= lot.estimatedWeight ? 15 : 5
  const location = recycler.location.split(',')[1]?.trim() === lot.location.split(',')[1]?.trim() ? 15 : 7
  const price = referenceTotal > 0 && lot.askingPrice <= referenceTotal * 1.25 ? 10 : 4
  const verification = recycler.verificationStatus === VerificationStatus.VERIFIED ? 10 : 0
  const reasons = [material ? 'Material accepted' : 'Material needs review', capability ? 'Processing capability matched' : 'Capability not listed', capacity === 15 ? 'Capacity sufficient' : 'Capacity needs confirmation', location === 15 ? 'Location compatible' : 'Location may require logistics', price === 10 ? 'Price acceptable' : 'Price needs discussion', verification === 10 ? 'Platform verified' : 'Verification is not complete']
  return { recycler, compatibilityScore: material + capability + capacity + location + price + verification, reasons }
}
export const allowedTransitions: Record<LotStatus, LotStatus[]> = {
  [LotStatus.DRAFT]: [LotStatus.LISTED, LotStatus.CANCELLED], [LotStatus.LISTED]: [LotStatus.MATCHED, LotStatus.CANCELLED], [LotStatus.MATCHED]: [LotStatus.ACCEPTED, LotStatus.CANCELLED, LotStatus.DISPUTED], [LotStatus.ACCEPTED]: [LotStatus.PAID, LotStatus.CANCELLED, LotStatus.DISPUTED], [LotStatus.PAID]: [LotStatus.HANDED_OVER, LotStatus.DISPUTED], [LotStatus.HANDED_OVER]: [LotStatus.RECEIVED, LotStatus.DISPUTED], [LotStatus.RECEIVED]: [LotStatus.PROCESSING, LotStatus.DISPUTED], [LotStatus.PROCESSING]: [LotStatus.COMPLETED, LotStatus.DISPUTED], [LotStatus.COMPLETED]: [], [LotStatus.CANCELLED]: [], [LotStatus.DISPUTED]: [LotStatus.ACCEPTED, LotStatus.CANCELLED],
}
export function canTransition(from: LotStatus, to: LotStatus) { return allowedTransitions[from].includes(to) }

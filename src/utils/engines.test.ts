import { describe, expect, it } from 'vitest'
import { demoLot, priceReferences, recyclers } from '../data/seed'
import { canTransition, evaluatePrice, scoreRecycler } from './engines'
import { LotStatus, VerificationStatus } from '../types/domain'

describe('platform engines', () => {
  it('flags a high asking price without changing it', () => { const result = evaluatePrice(demoLot, priceReferences[0]); expect(result.askingPrice).toBe(8500); expect(result.priceFlag).toBe(true); expect(result.priceStatus).toBe('HIGH') })
  it('marks extreme deviations as abnormal', () => { const result = evaluatePrice({ ...demoLot, askingPrice: 20000 }, priceReferences[0]); expect(result.priceStatus).toBe('ABNORMAL'); expect(result.priceFlag).toBe(true) })
  it('scores verified compatible recyclers', () => { const result = scoreRecycler(demoLot, recyclers[0], evaluatePrice(demoLot, priceReferences[0]).referencePrice); expect(result.compatibilityScore).toBe(100); expect(result.recycler.verificationStatus).toBe(VerificationStatus.VERIFIED) })
  it('does not award capability points for unrelated capabilities', () => { const result = scoreRecycler(demoLot, { ...recyclers[0], processingCapabilities: ['Metal polishing'] }, evaluatePrice(demoLot, priceReferences[0]).referencePrice); expect(result.compatibilityScore).toBe(80) })
  it('blocks completed to listed transitions', () => { expect(canTransition(LotStatus.COMPLETED, LotStatus.LISTED)).toBe(false); expect(canTransition(LotStatus.PAID, LotStatus.HANDED_OVER)).toBe(true) })
})

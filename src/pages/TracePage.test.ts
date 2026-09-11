import { describe, expect, it } from 'vitest'
import { publicTraceExists } from './TracePage'
import { demoLot } from '../data/seed'

describe('public trace', () => {
  it('only exposes known lot traces', () => { expect(publicTraceExists(demoLot.lotId)).toBe(true); expect(publicTraceExists('LOT-missing')).toBe(false) })
})
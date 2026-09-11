import { describe, expect, it } from 'vitest'
import { localizedSafetyGuides } from './translations'

describe('safety translations', () => {
  it('localizes titles and instructions', () => { const tamil = localizedSafetyGuides('ta'); expect(tamil[0].title).toBe('பேட்டரி கையாளுதல்'); expect(tamil[0].instructions[0]).not.toBe(localizedSafetyGuides('en')[0].instructions[0]) })
  it('provides the complete English fallback dictionary', () => { expect(localizedSafetyGuides('en')).toHaveLength(7) })
})
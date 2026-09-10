import type { Lot, SyncStatus } from '../types'

const LOTS_KEY = 'waste2worth:collector:lots'
const PROFILE_KEY = 'waste2worth:collector:profile'

export function readLots(): Lot[] {
  try { return JSON.parse(localStorage.getItem(LOTS_KEY) || '[]') as Lot[] } catch { return [] }
}
export function writeLots(lots: Lot[]) { localStorage.setItem(LOTS_KEY, JSON.stringify(lots)) }
export function readProfile<T>(): T | null { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as T } catch { return null } }
export function writeProfile(profile: unknown) { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) }
export function updateLotSync(lotId: string, syncStatus: SyncStatus) {
  writeLots(readLots().map((lot) => lot.lotId === lotId ? { ...lot, syncStatus } : lot))
}
export function queueLot(lot: Lot) {
  const lots = readLots().filter((item) => item.lotId !== lot.lotId)
  writeLots([...lots, lot])
}

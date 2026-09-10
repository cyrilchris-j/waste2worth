import { addDoc, collection, doc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore'
import { db, storage } from '../firebase'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import type { EvidenceReference, Lot } from '../types'
import { queueLot, readLots, updateLotSync } from './offline'

export async function uploadEvidence(collectorId: string, lotId: string, file: File): Promise<EvidenceReference> {
  const base: EvidenceReference = { id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, createdAt: new Date().toISOString() }
  if (!storage || !navigator.onLine) return { ...base, dataUrl: await fileToDataUrl(file) }
  const path = `lots/${collectorId}/${lotId}/${base.id}-${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return { ...base, storagePath: path, downloadUrl: await getDownloadURL(storageRef) }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
}

export async function persistLot(lot: Lot) {
  queueLot(lot)
  if (!db || !navigator.onLine) return
  await setDoc(doc(db, 'lots', lot.lotId), { ...lot, syncStatus: 'SYNCED' })
  updateLotSync(lot.lotId, 'SYNCED')
}

export async function syncPendingLots() {
  if (!db || !navigator.onLine) return
  for (const lot of readLots().filter((item) => item.syncStatus === 'PENDING_SYNC' || item.syncStatus === 'SYNC_ERROR')) {
    try { updateLotSync(lot.lotId, 'SYNCING'); await setDoc(doc(db, 'lots', lot.lotId), { ...lot, syncStatus: 'SYNCED' }); updateLotSync(lot.lotId, 'SYNCED') }
    catch { updateLotSync(lot.lotId, 'SYNC_ERROR') }
  }
}

export async function loadRemoteLots(collectorId: string) {
  if (!db) return []
  const snapshot = await getDocs(query(collection(db, 'lots'), where('collectorId', '==', collectorId)))
  return snapshot.docs.map((item) => item.data() as Lot)
}

export async function saveProfileToFirebase(profile: Record<string, unknown>) {
  if (!db) return
  await setDoc(doc(db, 'collectorProfiles', String(profile.collectorId)), profile)
  await setDoc(doc(db, 'users', String(profile.collectorId)), { userId: profile.collectorId, role: 'COLLECTOR', email: profile.email, fullName: profile.fullName })
}

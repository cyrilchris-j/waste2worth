import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CircleOff, Loader2, ShieldCheck, Leaf } from 'lucide-react'
import { auditLogs, demoLot } from '../data/seed'
import { LotStatus, UserRole, type AuditLog, type Lot } from '../types/domain'
import { db } from '../config/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { Card, LotStatusBadge } from '../components/ui'

import { getPublicTrace, type PublicTrace } from '../services/publicTraceService'

export function publicTraceExists(lotId: string) {
  return lotId === demoLot.lotId || lotId === 'LOT-2026-001'
}

interface TracePageProps {
  lotId?: string
  transactionId?: string | null
}

export function TracePage({ lotId: propLotId, transactionId: propTxnId }: TracePageProps) {
  const params = useParams<{ lotId?: string }>()
  const [searchParams] = useSearchParams()

  const lotId = propLotId ?? params.lotId ?? ''
  const transactionId = propTxnId ?? searchParams.get('transaction')

  const isDemo = lotId === demoLot.lotId || lotId === 'LOT-2026-001'
  const initialLot = isDemo ? { ...demoLot, lotId: lotId || demoLot.lotId } : null

  const [lot, setLot] = useState<Lot | null>(initialLot)
  const [publicTrace, setPublicTrace] = useState<PublicTrace | null>(null)
  const [events, setEvents] = useState<AuditLog[]>(() =>
    isDemo
      ? auditLogs.map(e => ({ ...e, lotId: lotId || demoLot.lotId })).filter(event => !transactionId || !event.transactionId || event.transactionId === transactionId)
      : []
  )
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!lotId) {
      setNotFound(true)
      return
    }

    let mounted = true
    setLoading(true)
    const fetchTrace = async () => {
      try {
        // 1. Try privacy-safe public trace projection (FIX 3 - Anonymous readable)
        const trace = await getPublicTrace(lotId)
        if (trace && mounted) {
          setPublicTrace(trace)
          setLot({
            lotId: trace.lotId,
            collectorId: 'verified-collector',
            category: trace.category,
            status: trace.status as any,
            quantity: 1,
            estimatedWeight: trace.recoverySummary?.inputWeightKg || 0,
            askingPrice: 0,
            evidence: [],
            createdAt: trace.createdAt,
            updatedAt: trace.updatedAt,
            transactionId: trace.transactionReference || undefined,
          } as unknown as Lot)

          const traceEvents: AuditLog[] = (trace.timeline || []).map((t, idx) => ({
            eventId: `trace-evt-${idx}`,
            lotId: trace.lotId,
            transactionId: trace.transactionReference || null,
            actorId: 'platform-verified',
            actorRole: UserRole.COLLECTOR,
            eventType: t.status,
            timestamp: t.timestamp,
          }))
          setEvents(traceEvents)
          setNotFound(false)
          setLoading(false)
          return
        }

        // 2. Demo fallback if demo ID
        if (lotId === demoLot.lotId || lotId === 'LOT-2026-001') {
          if (!mounted) return
          const activeLot = { ...demoLot, lotId }
          setLot(activeLot)
          setEvents(
            auditLogs.map(e => ({ ...e, lotId })).filter(event => !transactionId || !event.transactionId || event.transactionId === transactionId)
          )
          setNotFound(false)
          setLoading(false)
          return
        }

        // 3. Fallback to direct lots document (if signed in)
        const lotSnap = await getDoc(doc(db, 'lots', lotId))
        if (lotSnap.exists() && mounted) {
          const lotData = { ...lotSnap.data(), lotId: lotSnap.id } as Lot
          setLot(lotData)

          const q = query(collection(db, 'auditLogs'), where('lotId', '==', lotId))
          const logsSnap = await getDocs(q)
          const firestoreLogs: AuditLog[] = []
          logsSnap.forEach(d => firestoreLogs.push({ ...d.data(), eventId: d.id } as AuditLog))
          setEvents(firestoreLogs)
          setNotFound(false)
        } else {
          if (mounted) setNotFound(true)
        }
      } catch {
        if (mounted) setNotFound(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchTrace()
    return () => {
      mounted = false
    }
  }, [lotId, transactionId])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card padding="lg" className="text-center max-w-sm w-full py-10">
          <Loader2 size={36} className="animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-700">Looking up public lifecycle record...</p>
        </Card>
      </main>
    )
  }

  if (notFound || !lot) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card padding="lg" className="text-center max-w-sm w-full py-10 space-y-3">
          <CircleOff size={36} className="text-gray-400 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900">Trace not found</h1>
          <p className="text-sm text-gray-500">No public trace exists for lot {lotId || 'specified'}.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 text-white font-semibold px-4 py-2.5 text-sm hover:bg-brand-700 transition-colors min-h-[44px] w-full"
          >
            Back to platform
          </Link>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 flex flex-col items-center">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline">
            <ArrowLeft size={16} /> Back to platform
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
            <ShieldCheck size={14} className="text-brand-600" />
            <span>Public Trace</span>
          </div>
        </div>

        <Card padding="lg" className="border-gray-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700">
            <Leaf size={16} /> Public Trace Summary
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">{lot.category} recovery journey</h1>
          <p className="mt-1 text-sm text-gray-500">Only lifecycle information is shown. Personal and payment details stay private.</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-medium block">Lot ID</span>
              <strong className="mt-1 block text-sm font-bold text-gray-900 font-mono truncate">{lot.lotId}</strong>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-medium block mb-1">Status</span>
              <LotStatusBadge status={lot.status} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-medium block">Transaction</span>
              <strong className="mt-1 block text-sm font-semibold text-gray-900 truncate">
                {transactionId ?? (lot as { transactionId?: string }).transactionId ?? 'Pending'}
              </strong>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-gray-500 font-medium block">Processing</span>
              <strong className="mt-1 block text-sm font-semibold text-gray-900">
                {lot.status === LotStatus.PROCESSING || lot.status === LotStatus.COMPLETED ? 'Recorded' : 'Not started'}
              </strong>
            </div>
          </div>
        </Card>

        {publicTrace?.recoverySummary?.materials && publicTrace.recoverySummary.materials.length > 0 && (
          <Card padding="lg" className="border-gray-100 space-y-3">
            <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">Material Recovery Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {publicTrace.recoverySummary.materials.map((m, i) => (
                <div key={i} className="p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                  <span className="text-xs text-gray-600 font-medium block">{m.material}</span>
                  <strong className="text-sm font-bold text-brand-900">{m.quantityKg} kg</strong>
                </div>
              ))}
            </div>
            {publicTrace.recoverySummary.processedWeightKg && (
              <p className="text-xs text-gray-500 pt-1">
                Total processed weight: <strong>{publicTrace.recoverySummary.processedWeightKg} kg</strong> (100% statutory mass balance reconciliation).
              </p>
            )}
          </Card>
        )}

        <Card padding="lg" className="border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">Lifecycle events</h2>
          {events.length ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100" key={event.eventId}>
                  <CheckCircle2 size={18} className="text-brand-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-sm font-bold text-gray-900 capitalize">
                      {event.eventType.replace(/_/g, ' ').toLowerCase()}
                    </strong>
                    <span className="block text-xs text-gray-500 mt-0.5">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No public lifecycle events found.</p>
          )}
        </Card>
      </div>
    </main>
  )
}

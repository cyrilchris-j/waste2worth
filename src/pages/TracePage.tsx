import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CircleOff, Loader2 } from 'lucide-react'
import { auditLogs, demoLot } from '../data/seed'
import { LotStatus, type AuditLog, type Lot } from '../types/domain'
import { db } from '../config/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

export function publicTraceExists(lotId: string) {
  return lotId === demoLot.lotId
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

  const [lot, setLot] = useState<Lot | null>(lotId === demoLot.lotId ? demoLot : null)
  const [events, setEvents] = useState<AuditLog[]>(() =>
    auditLogs.filter(event => event.lotId === lotId && (!transactionId || !event.transactionId || event.transactionId === transactionId))
  )
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!lotId) {
      setNotFound(true)
      return
    }

    if (lotId === demoLot.lotId) {
      setLot(demoLot)
      setEvents(
        auditLogs.filter(event => event.lotId === lotId && (!transactionId || !event.transactionId || event.transactionId === transactionId))
      )
      setNotFound(false)
      return
    }

    // Try fetching from Firestore if it's a dynamic lot
    let mounted = true
    setLoading(true)
    const fetchTrace = async () => {
      try {
        const lotSnap = await getDoc(doc(db, 'lots', lotId))
        if (lotSnap.exists()) {
          if (!mounted) return
          const lotData = { ...lotSnap.data(), lotId: lotSnap.id } as Lot
          setLot(lotData)

          // Fetch audit logs for this lot
          const q = query(collection(db, 'auditLogs'), where('lotId', '==', lotId))
          const logsSnap = await getDocs(q)
          const firestoreLogs: AuditLog[] = []
          logsSnap.forEach(d => firestoreLogs.push({ ...d.data(), eventId: d.id } as AuditLog))
          setEvents(firestoreLogs)
          setNotFound(false)
        } else {
          if (!mounted) return
          setNotFound(true)
        }
      } catch {
        if (!mounted) return
        setNotFound(true)
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
      <main className="trace-page">
        <div className="trace-not-found" style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-4" />
          <p>Looking up public lifecycle record...</p>
        </div>
      </main>
    )
  }

  if (notFound || !lot) {
    return (
      <main className="trace-page">
        <div className="trace-not-found">
          <CircleOff size={32} />
          <h1>Trace not found</h1>
          <p>No public trace exists for lot {lotId || 'specified'}.</p>
          <Link to="/">Back to platform</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="trace-page">
      <div className="trace-wrap">
        <Link className="trace-back" to="/">
          <ArrowLeft size={15} /> Waste2Worth platform
        </Link>
        <div className="eyebrow">PUBLIC TRACE SUMMARY</div>
        <h1>{lot.category} recovery journey</h1>
        <p>Only lifecycle information is shown. Personal and payment details stay private.</p>
        <div className="trace-summary">
          <div>
            <span>Lot ID</span>
            <strong>{lot.lotId}</strong>
          </div>
          <div>
            <span>Current status</span>
            <strong>{lot.status}</strong>
          </div>
          <div>
            <span>Transaction</span>
            <strong>{transactionId ?? (lot as { transactionId?: string }).transactionId ?? 'Pending acceptance'}</strong>
          </div>
          <div>
            <span>Processing</span>
            <strong>
              {lot.status === LotStatus.PROCESSING || lot.status === LotStatus.COMPLETED ? 'Recorded' : 'Not started'}
            </strong>
          </div>
        </div>
        <section className="trace-events">
          <h2>Lifecycle events</h2>
          {events.length ? (
            events.map(event => (
              <div className="trace-event" key={event.eventId}>
                <CheckCircle2 size={17} />
                <div>
                  <strong>{event.eventType.replace(/_/g, ' ')}</strong>
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p>No public lifecycle events found.</p>
          )}
        </section>
      </div>
    </main>
  )
}

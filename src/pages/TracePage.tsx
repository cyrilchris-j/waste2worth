import { ArrowLeft, CheckCircle2, CircleOff } from 'lucide-react'
import { auditLogs, demoLot } from '../data/seed'
import { LotStatus } from '../types/domain'

export function publicTraceExists(lotId: string) { return lotId === demoLot.lotId }

export function TracePage({ lotId, transactionId }: { lotId: string; transactionId: string | null }) {
  const lot = publicTraceExists(lotId) ? demoLot : null
  if (!lot) return <main className="trace-page"><div className="trace-not-found"><CircleOff size={32} /><h1>Trace not found</h1><p>No public trace exists for lot {lotId}.</p><a href="/">Back to platform</a></div></main>
  const events = auditLogs.filter(event => event.lotId === lotId && (!transactionId || !event.transactionId || event.transactionId === transactionId))
  return <main className="trace-page"><div className="trace-wrap"><a className="trace-back" href="/"><ArrowLeft size={15} /> Waste2Worth platform</a><div className="eyebrow">PUBLIC TRACE SUMMARY</div><h1>{lot.category} recovery journey</h1><p>Only lifecycle information is shown. Personal and payment details stay private.</p><div className="trace-summary"><div><span>Lot ID</span><strong>{lot.lotId}</strong></div><div><span>Current status</span><strong>{lot.status}</strong></div><div><span>Transaction</span><strong>{transactionId ?? 'Not created'}</strong></div><div><span>Processing</span><strong>{lot.status === LotStatus.PROCESSING || lot.status === LotStatus.COMPLETED ? 'Recorded' : 'Not started'}</strong></div></div><section className="trace-events"><h2>Lifecycle events</h2>{events.length ? events.map(event => <div className="trace-event" key={event.eventId}><CheckCircle2 size={17} /><div><strong>{event.eventType.replace(/_/g, ' ')}</strong><span>{new Date(event.timestamp).toLocaleString()}</span></div></div>) : <p>No public lifecycle events found.</p>}</section></div></main>
}

import { CheckCircle2, Circle } from 'lucide-react'
import type { AuditLog } from '../types/domain'
export function TransactionTimeline({ events }: { events: AuditLog[] }) { return <div className="timeline">{events.map((event, index) => <div className="timeline-row" key={event.eventId}><div className="timeline-mark">{index < events.length - 1 ? <CheckCircle2 size={18} /> : <Circle size={18} />}</div><div><strong>{event.eventType.replace(/_/g, ' ')}</strong><span>{new Date(event.timestamp).toLocaleString()} · {event.actorRole}</span></div></div>)}</div> }

export default function StatCard({ label, value, detail, icon: Icon, tone = 'green' }) {
  return <div className="card p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p></div><span className={`rounded-lg p-2.5 ${tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-mint text-forest'}`}><Icon size={20} /></span></div>{detail && <p className="mt-3 text-xs text-slate-500">{detail}</p>}</div>
}

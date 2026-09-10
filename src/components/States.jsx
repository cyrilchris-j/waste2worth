import { Inbox, LoaderCircle, TriangleAlert } from 'lucide-react'

export function LoadingState() { return <div className="flex min-h-[250px] items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin text-forest" size={20} />Loading workspace...</div> }
export function EmptyState({ title = 'Nothing here yet', text = 'New activity will appear here once it is available.' }) { return <div className="py-12 text-center"><Inbox className="mx-auto mb-3 text-slate-300" size={38} /><p className="font-semibold text-ink">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div> }
export function ErrorState() { return <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700"><TriangleAlert size={18} />Unable to load this section. Please try again later.</div> }

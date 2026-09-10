import { Recycle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Logo({ light = false }) {
  return <Link to="/" className={`flex items-center gap-2.5 font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest text-white"><Recycle size={20} /></span>
    <span>E-Waste <span className={light ? 'text-emerald-200' : 'text-forest'}>Connect</span></span>
  </Link>
}

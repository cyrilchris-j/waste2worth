import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, PackageCheck, Recycle, Settings, Truck, Users, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from './Logo'

export const roles = { household: 'Household / Business', collector: 'Collector', recycler: 'Recycler', admin: 'Administrator' }
const icons = { household: LayoutDashboard, collector: Truck, recycler: Recycle, admin: Users }

export default function DashboardLayout({ role, children }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const Icon = icons[role] || LayoutDashboard
  return <div className="flex min-h-screen bg-sand">
    <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white px-5 py-6 transition-transform md:static md:translate-x-0`}>
      <div className="mb-10 flex items-center justify-between"><Logo /><button onClick={() => setOpen(false)} className="md:hidden"><X size={20} /></button></div>
      <div className="mb-6 rounded-lg bg-mint p-3"><p className="text-xs text-slate-500">Signed in as</p><p className="mt-1 text-sm font-semibold text-ink">{roles[role]}</p></div>
      <nav className="space-y-1">
        <NavLink to={`/dashboard/${role}`} end className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-mint text-forest' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={18} />Overview</NavLink>
        <NavLink to={`/dashboard/${role}/collections`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><PackageCheck size={18} />Collections</NavLink>
        <NavLink to={`/dashboard/${role}/settings`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Settings size={18} />Settings</NavLink>
      </nav>
      <button onClick={() => navigate('/')} className="absolute bottom-7 left-8 flex items-center gap-3 text-sm font-semibold text-slate-500 hover:text-forest"><LogOut size={18} />Sign out</button>
    </aside>
    {open && <button aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-ink/20 md:hidden" />}
    <main className="min-w-0 flex-1">
      <header className="flex h-[73px] items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-9">
        <button onClick={() => setOpen(true)} className="text-slate-600 md:hidden"><Menu /></button>
        <div className="hidden text-sm text-slate-500 md:block">Workspace <span className="mx-2 text-slate-300">/</span> {roles[role]}</div>
        <div className="ml-auto flex items-center gap-4"><button className="relative text-slate-500"><Bell size={19} /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-forest" /></button><div className="flex items-center gap-2 border-l border-slate-200 pl-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">EC</span><ChevronDown size={15} className="text-slate-400" /></div></div>
      </header>
      <div className="mx-auto max-w-7xl p-5 lg:p-9">{children}</div>
    </main>
  </div>
}

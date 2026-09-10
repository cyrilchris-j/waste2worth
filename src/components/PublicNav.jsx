import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import Logo from './Logo'

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  return <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
      <Logo />
      <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-600 md:hidden" aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      <nav className={`${open ? 'absolute left-0 right-0 top-[73px] z-20 flex border-b border-slate-200 bg-white p-5 shadow-md' : 'hidden'} flex-col gap-4 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0 md:shadow-none`}>
        <a href="/#how-it-works" className="text-sm font-medium text-slate-600 hover:text-forest">How it works</a>
        <a href="/#impact" className="text-sm font-medium text-slate-600 hover:text-forest">Our impact</a>
        <Link to="/login" className="btn-secondary">Log in</Link>
        <Link to="/register" className="btn-primary">Get started</Link>
      </nav>
    </div>
  </header>
}

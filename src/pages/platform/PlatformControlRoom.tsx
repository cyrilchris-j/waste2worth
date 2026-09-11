import { useMemo, useState } from 'react'
import { Activity, ArrowRight, BarChart3, CircleHelp, ClipboardCheck, Languages, LayoutDashboard, Menu, PackageCheck, ShieldCheck, Sparkles, Truck, X } from 'lucide-react'
import { AdminPanel } from '../../components/AdminPanel'
import { MatchingList } from '../../components/MatchingList'
import { PricePanel } from '../../components/PricePanel'
import { QrTrace } from '../../components/QrTrace'
import { SafetyLibrary } from '../../components/SafetyLibrary'
import { TransactionTimeline } from '../../components/TransactionTimeline'
import { auditLogs, demoLot, priceReferences, recyclers, safetyGuides } from '../../data/seed'
import { translations, type Language } from '../../locales/translations'
import { UserRole } from '../../types/domain'
import { evaluatePrice, scoreRecycler } from '../../utils/engines'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Matching', icon: Sparkles },
  { label: 'Transactions', icon: Activity },
  { label: 'Safety', icon: CircleHelp },
  { label: 'Admin', icon: ShieldCheck }
]

export default function PlatformControlRoom() {
  const [active, setActive] = useState('Overview')
  const [language, setLanguage] = useState<Language>('en')
  const [menuOpen, setMenuOpen] = useState(false)
  const t = translations[language]

  const reference = priceReferences.find(item => item.category === demoLot.category) ?? priceReferences[0]
  const evaluation = useMemo(() => evaluatePrice(demoLot, reference), [reference])
  const matches = useMemo(
    () => recyclers.map(recycler => scoreRecycler(demoLot, recycler, evaluation.referencePrice)).sort((a, b) => b.compatibilityScore - a.compatibilityScore),
    [evaluation.referencePrice]
  )

  const nav = (label: string) => {
    setActive(label)
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">W</div>
          <div>
            <b>Waste2Worth</b>
            <span>Platform intelligence</span>
          </div>
          <button className="close-menu" onClick={() => setMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={active === label ? 'nav-item active' : 'nav-item'}
              key={label}
              onClick={() => nav(label)}
            >
              <Icon size={18} />
              {label}
              {label === 'Matching' && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="safety-chip">
            <ShieldCheck size={17} />
            <span>
              <b>Platform layer</b>
              <small>Transaction-safe by design</small>
            </span>
          </div>
          <div className="profile">
            <div className="avatar">P</div>
            <span>
              <b>Prasanna</b>
              <small>Platform owner · {UserRole.ADMIN}</small>
            </span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="crumb">
            <span>Workspace</span>
            <ArrowRight size={14} />
            <b>{active}</b>
          </div>
          <div className="top-actions">
            <label className="language">
              <Languages size={16} />
              <select
                value={language}
                onChange={event => setLanguage(event.target.value as Language)}
                aria-label={t.language}
              >
                <option value="en">EN</option>
                <option value="ta">தமிழ்</option>
                <option value="hi">हिन्दी</option>
              </select>
            </label>
            <div className="status-dot">
              <span /> Demo environment
            </div>
          </div>
        </header>

        <div className="content">
          {active === 'Overview' && (
            <>
              <section className="hero">
                <div>
                  <div className="eyebrow light">TRANSACTION CONTROL ROOM</div>
                  <h1>
                    Turn material<br />
                    <em>into momentum.</em>
                  </h1>
                  <p>{t.overview} One continuous record from listed lot to responsible processing.</p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => nav('Matching')}>
                      Explore matches <ArrowRight size={17} />
                    </button>
                    <button className="text-button" onClick={() => nav('Transactions')}>
                      Open timeline
                    </button>
                  </div>
                </div>
                <div className="hero-orbit">
                  <div className="orbit-center">
                    ₹<b>{demoLot.askingPrice.toLocaleString('en-IN')}</b>
                    <small>asking value</small>
                  </div>
                  <div className="orbit-line line-one" />
                  <div className="orbit-line line-two" />
                  <div className="orbit-tag tag-one">
                    <PackageCheck size={15} /> Lot listed
                  </div>
                  <div className="orbit-tag tag-two">
                    <Truck size={15} /> Handover ready
                  </div>
                </div>
              </section>

              <div className="stats">
                <div>
                  <span>Active lot</span>
                  <strong>{demoLot.lotId}</strong>
                  <small>{demoLot.quantity} units · {demoLot.estimatedWeight} kg</small>
                </div>
                <div>
                  <span>Best compatibility</span>
                  <strong>{matches[0].compatibilityScore}%</strong>
                  <small>{matches[0].recycler.facility}</small>
                </div>
                <div>
                  <span>Lifecycle status</span>
                  <strong>{demoLot.status}</strong>
                  <small>Last updated 10:10 today</small>
                </div>
                <div>
                  <span>Trace events</span>
                  <strong>{auditLogs.length}</strong>
                  <small>Append-only audit trail</small>
                </div>
              </div>

              <div className="two-column">
                <PricePanel evaluation={evaluation} />
                <QrTrace lotId={demoLot.lotId} transactionId="TXN-2026-014" />
              </div>

              <section>
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">MATCHING ENGINE</div>
                    <h2>Where this lot can go next.</h2>
                  </div>
                  <button className="text-button" onClick={() => nav('Matching')}>
                    View all <ArrowRight size={15} />
                  </button>
                </div>
                <MatchingList matches={matches.slice(0, 2)} />
              </section>
            </>
          )}

          {active === 'Matching' && (
            <>
              <div className="page-title">
                <div className="eyebrow">MATCHING ENGINE</div>
                <h1>{t.matching}</h1>
                <p>Weighted compatibility across material, capability, capacity, location, price, and platform verification.</p>
              </div>
              <MatchingList matches={matches} />
            </>
          )}

          {active === 'Transactions' && (
            <>
              <div className="page-title">
                <div className="eyebrow">{t.timeline.toUpperCase()}</div>
                <h1>One lot. One continuous story.</h1>
                <p>Every state transition stays tied to {demoLot.lotId}.</p>
              </div>
              <div className="two-column timeline-grid">
                <TransactionTimeline events={auditLogs} />
                <div>
                  <div className="transaction-card">
                    <span className="status-pill">{demoLot.status}</span>
                    <h3>TXN-2026-014</h3>
                    <p>{demoLot.category} recovery · {demoLot.estimatedWeight} kg</p>
                    <div className="transaction-row">
                      <span>Amount</span>
                      <b>₹{demoLot.askingPrice.toLocaleString('en-IN')}</b>
                    </div>
                    <div className="transaction-row">
                      <span>Payment</span>
                      <b className="green">Mock payment ready</b>
                    </div>
                    <button className="primary-button full">
                      Advance workflow <ArrowRight size={17} />
                    </button>
                  </div>
                  <QrTrace lotId={demoLot.lotId} transactionId="TXN-2026-014" />
                </div>
              </div>
            </>
          )}

          {active === 'Safety' && (
            <>
              <div className="page-title">
                <div className="eyebrow">FIELD NOTES</div>
                <h1>{t.safety}</h1>
                <p>Practical guidance for safer handling, collection, and handover.</p>
              </div>
              <SafetyLibrary guides={safetyGuides} />
            </>
          )}

          {active === 'Admin' && (
            <>
              <div className="page-title">
                <div className="eyebrow">PLATFORM ADMIN</div>
                <h1>{t.admin}</h1>
                <p>Hackathon simulation of recycler verification and platform oversight. No government API claims.</p>
              </div>
              <AdminPanel recyclers={recyclers} />
              <div className="admin-overview">
                <div>
                  <BarChart3 size={19} />
                  <span>Lots in view</span>
                  <b>12</b>
                </div>
                <div>
                  <ClipboardCheck size={19} />
                  <span>Transactions</span>
                  <b>4</b>
                </div>
                <div>
                  <Activity size={19} />
                  <span>Audit events</span>
                  <b>{auditLogs.length}</b>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

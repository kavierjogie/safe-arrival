import { Link, NavLink, Outlet } from 'react-router-dom'
import { AlertOctagon, Building2, IdCard, LayoutDashboard, MessageCircle, ShieldAlert } from 'lucide-react'
import { ConnectionIndicator, Logo } from '../common/ui'
import { useDemo } from '../../context/DemoContext'
import { deriveAlerts } from '../../lib/journeyUtils'

export function PublicHeader({ dark = false }) {
  const nav = ({ isActive }) => `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? (dark ? 'text-white' : 'text-navy') : dark ? 'text-white/70 hover:text-white' : 'text-muted hover:text-navy'}`
  return (
    <header className={dark ? 'bg-navy' : 'border-b border-slate-200 bg-white'}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Logo light={dark} />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <NavLink to="/demo" className={nav}>Tourist demo</NavLink>
          <NavLink to="/hotel" className={nav}>Hotel</NavLink>
          <NavLink to="/operations" className={nav}>Operations</NavLink>
          <NavLink to="/privacy" className={nav}>Privacy</NavLink>
        </nav>
        <ConnectionIndicator light={dark} />
      </div>
    </header>
  )
}

/** Shell for the hotel and operations dashboards: sidebar on desktop, tab strip on mobile. */
export function DashboardLayout() {
  const { journeys, incidents } = useDemo()
  const alertCount = deriveAlerts({ journeys, incidents }).length
  const openIncidents = incidents.filter((i) => ['new', 'acknowledged', 'investigating'].includes(i.incident_status)).length
  const items = [
    ['/hotel', 'Hotel dashboard', Building2],
    ['/operations', 'Operations overview', LayoutDashboard, alertCount],
    ['/operations/incidents', 'Incidents', AlertOctagon, openIncidents],
    ['/operations/drivers', 'Driver verification', IdCard],
    ['/operations/scams', 'Scam insights', ShieldAlert],
  ]
  const cls = ({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-navy px-3 py-4 lg:flex lg:sticky lg:top-0 lg:h-dvh">
        <div className="px-2"><Logo light /></div>
        <nav aria-label="Dashboards" className="mt-6 space-y-1">
          {items.map(([to, label, Icon, count]) => (
            <NavLink key={to} to={to} end className={cls}>
              <Icon className="size-4" aria-hidden /><span className="flex-1">{label}</span>
              {count > 0 && <span className="rounded-full bg-alert px-1.5 text-[11px] font-semibold text-white" aria-label={`${count} open`}>{count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 px-2">
          <Link to="/demo" className="flex items-center gap-2 rounded-lg bg-teal/15 px-3 py-2 text-sm font-medium text-white hover:bg-teal/25"><MessageCircle className="size-4 text-teal" aria-hidden />Open tourist demo</Link>
          <ConnectionIndicator light />
          <p className="text-[11px] leading-snug text-white/50">Prototype. All drivers, guests and incidents are fictional demo data.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-[450] bg-navy lg:hidden">
          <div className="flex items-center justify-between px-4 py-3"><Logo light /><ConnectionIndicator light /></div>
          <nav aria-label="Dashboards" className="flex gap-1 overflow-x-auto px-2 pb-2">
            {items.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${isActive ? 'bg-white/15 text-white' : 'text-white/70'}`}>
                <Icon className="size-3.5" aria-hidden />{label}
              </NavLink>
            ))}
          </nav>
        </div>
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6"><Outlet /></main>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}


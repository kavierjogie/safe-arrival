import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertOctagon, AlertTriangle, ArrowRight, CheckCircle2, IdCard, Navigation, Search, ShieldAlert } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { PageHeader } from '../components/layout/Layouts'
import { DemoTag, EmptyState, Panel, Skeleton, StatCard, inputCls, inputW } from '../components/common/ui'
import { DriverStatusBadge, IncidentStatusBadge, JourneyStatusBadge, SafetyBadge, SeverityBadge } from '../components/common/StatusBadges'
import { HBarChart, TrendChart, weeklyCounts } from '../components/common/Charts'
import JourneyMap from '../components/journey/JourneyMap'
import JourneyDetail from '../components/journey/JourneyDetail'
import { ago } from '../components/journey/JourneyBits'
import {
  ALERT_TYPES, DRIVER_STATUSES, INCIDENT_CATEGORIES, JOURNEY_STATUS, SEVERITIES, deriveAlerts, formatEta, guestRef, isActive, needsMonitoring,
} from '../lib/journeyUtils'

const STATUS_COLORS = { awaiting_transport: '#94a3b8', driver_assigned: '#173B57', driver_confirmed: '#13A89E', picked_up: '#13A89E', on_route: '#13A89E', arrived: '#21A675', safety_check_pending: '#E9A23B', completed: '#21A675', incident_reported: '#DC5353' }

export default function OperationsDashboardPage() {
  const { journeys, incidents, drivers, scam_reports, journey_updates, driverById, loading } = useDemo()
  const [sev, setSev] = useState('all')
  const [q, setQ] = useState('')
  const [statusF, setStatusF] = useState('active')
  const [selectedId, setSelectedId] = useState(null)

  const alerts = useMemo(() => deriveAlerts({ journeys, incidents }), [journeys, incidents])
  const shownAlerts = alerts.filter((a) => sev === 'all' || a.severity === sev)
  const active = journeys.filter(isActive)
  const openIncidents = incidents.filter((i) => !['resolved', 'closed'].includes(i.incident_status))

  const table = journeys
    .filter((j) => (statusF === 'active' ? needsMonitoring(j) : statusF === 'all' ? true : j.journey_status === statusF))
    .filter((j) => {
      if (!q.trim()) return true
      const d = driverById(j.driver_id)
      return [j.journey_reference, j.tourist_name, j.destination, d?.full_name, d?.registration_number].some((v) => v?.toLowerCase().includes(q.toLowerCase()))
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

  const statusData = Object.keys(JOURNEY_STATUS).map((k) => ({ name: JOURNEY_STATUS[k], value: journeys.filter((j) => j.journey_status === k).length, color: STATUS_COLORS[k] })).filter((d) => d.value)
  const catData = Object.entries(INCIDENT_CATEGORIES).map(([k, v]) => ({ name: v, value: incidents.filter((i) => i.category === k).length, color: '#173B57' })).filter((d) => d.value).sort((a, b) => b.value - a.value)
  const driverCounts = Object.keys(DRIVER_STATUSES).map((k) => [k, drivers.filter((d) => d.verification_status === k).length])

  const activity = useMemo(() => [
    ...journey_updates.map((u) => ({ id: u.id, at: u.created_at, icon: Navigation, text: `${journeys.find((j) => j.id === u.journey_id)?.journey_reference ?? 'Journey'} · ${u.description}`, journeyId: u.journey_id })),
    ...incidents.map((i) => ({ id: i.id, at: i.created_at, icon: AlertOctagon, text: `${i.case_reference} reported · ${INCIDENT_CATEGORIES[i.category]}`, tone: 'text-alert-ink' })),
    ...scam_reports.map((s) => ({ id: s.id, at: s.created_at, icon: ShieldAlert, text: `Scam report · ${s.location}`, tone: 'text-amber-ink' })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 12), [journey_updates, incidents, scam_reports, journeys])

  const selected = journeys.find((j) => j.id === selectedId)

  return (
    <>
      <PageHeader title="Safety operations" subtitle="Live view of airport journeys, incidents and tourist-safety signals across Cape Town."><DemoTag /></PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {loading ? [1, 2, 3, 4, 5].map((k) => <Skeleton key={k} className="h-24" />) : <>
          <StatCard label="Active journeys" value={active.length} icon={Navigation} tone="teal" />
          <StatCard label="Completed journeys" value={journeys.filter((j) => j.journey_status === 'completed').length} icon={CheckCircle2} tone="green" />
          <StatCard label="Reported incidents" value={incidents.length} icon={AlertOctagon} tone="red" hint={`${openIncidents.length} open`} />
          <StatCard label="Drivers registered" value={drivers.length} icon={IdCard} tone="navy" hint={`${drivers.filter((d) => d.verification_status === 'verified').length} verified`} />
          <StatCard label="Active safety alerts" value={alerts.length} icon={AlertTriangle} tone={alerts.length ? 'amber' : 'green'} hint={`${alerts.filter((a) => a.severity === 'critical').length} critical`} />
        </>}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Active journeys map" bodyClass="p-3" action={<span className="text-xs text-muted">{active.length} active · click a vehicle</span>}>
          <JourneyMap journeys={journeys.filter(needsMonitoring)} height="h-[380px]" onSelect={(j) => setSelectedId(j.id)} />
        </Panel>

        <Panel title={`Alerts (${alerts.length})`} action={
          <select aria-label="Filter alerts by severity" value={sev} onChange={(e) => setSev(e.target.value)} className="rounded-md border border-slate-200 px-2 py-1 text-xs">
            <option value="all">All severities</option>
            {Object.entries(SEVERITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        }>
          {shownAlerts.length === 0 ? <EmptyState icon={CheckCircle2} title="No alerts at this severity" /> : (
            <ul className="max-h-[400px] divide-y divide-slate-100 overflow-y-auto">
              {shownAlerts.map((a) => (
                <li key={a.id}>
                  <button onClick={() => a.journey_id && setSelectedId(a.journey_id)} disabled={!a.journey_id} className="flex w-full flex-col gap-1 px-4 py-3 text-left enabled:hover:bg-slate-50">
                    <span className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{ALERT_TYPES[a.type]}</span><SeverityBadge severity={a.severity} /></span>
                    <span className="text-xs text-muted">{a.detail} · {ago(a.at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-6" title="Active journey monitoring" action={
        <div className="flex flex-wrap gap-2">
          <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted" aria-hidden />
            <input aria-label="Search journeys" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, guest, driver, reg…" className={`${inputW('w-56')} py-1.5 pl-8`} /></div>
          <select aria-label="Filter by status" value={statusF} onChange={(e) => setStatusF(e.target.value)} className={`${inputW('w-auto')} py-1.5`}>
            <option value="active">Active only</option><option value="all">All statuses</option>
            {Object.entries(JOURNEY_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      }>
        {table.length === 0 ? <EmptyState icon={Search} title="No journeys match">Try a different search or status filter.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap min-w-[900px] text-sm">
              <thead className="text-left text-xs text-muted"><tr className="border-b border-slate-100">{['Journey ID', 'Tourist', 'Destination', 'Driver', 'Registration', 'Status', 'Safety', 'ETA', 'Last update'].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {table.map((j) => {
                  const d = driverById(j.driver_id)
                  return (
                    <tr key={j.id} onClick={() => setSelectedId(j.id)} className="cursor-pointer border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); setSelectedId(j.id) }} className="font-mono text-xs font-medium hover:underline">{j.journey_reference}</button></td>
                      <td className="px-4 py-3">{guestRef(j)}</td>
                      <td className="max-w-[200px] truncate px-4 py-3">{j.destination}</td>
                      <td className="px-4 py-3">{d?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono">{d?.registration_number ?? '—'}</td>
                      <td className="px-4 py-3"><JourneyStatusBadge status={j.journey_status} /></td>
                      <td className="px-4 py-3"><SafetyBadge status={j.safety_status} /></td>
                      <td className="px-4 py-3 tabular-nums">{formatEta(j)}</td>
                      <td className="px-4 py-3 text-muted">{ago(j.updated_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Journey status distribution" bodyClass="p-3"><HBarChart data={statusData} label="Journeys" /></Panel>
        <Panel title="Incidents by category" bodyClass="p-3"><HBarChart data={catData} label="Incidents" /></Panel>
        <Panel title="Scam reports trend" bodyClass="p-3" action={<Link to="/operations/scams" className="text-xs font-medium text-teal-ink hover:underline">Insights</Link>}><TrendChart data={weeklyCounts(scam_reports)} /></Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Recent incidents" action={<Link to="/operations/incidents" className="flex items-center gap-1 text-xs font-medium text-teal-ink hover:underline">Manage<ArrowRight className="size-3" aria-hidden /></Link>}>
          <ul className="divide-y divide-slate-100">
            {[...incidents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((i) => (
              <li key={i.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm font-semibold">{i.case_reference}</span><IncidentStatusBadge status={i.incident_status} /></div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted"><SeverityBadge severity={i.severity} />{INCIDENT_CATEGORIES[i.category]} · {ago(i.created_at)}</div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Driver verification overview" action={<Link to="/operations/drivers" className="flex items-center gap-1 text-xs font-medium text-teal-ink hover:underline">Drivers<ArrowRight className="size-3" aria-hidden /></Link>} bodyClass="p-4 space-y-3">
          {driverCounts.map(([k, n]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-28"><DriverStatusBadge status={k} /></span>
              <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-deep" style={{ width: `${drivers.length ? (n / drivers.length) * 100 : 0}%` }} /></div>
              <span className="w-6 text-right text-sm font-semibold tabular-nums">{n}</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted">Simulated verification workflow — no real identity documents are checked.</p>
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><Activity className="size-4" aria-hidden />Safety activity</span>}>
          <ol className="max-h-[320px] divide-y divide-slate-100 overflow-y-auto">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 px-4 py-2.5">
                <a.icon className={`mt-0.5 size-4 shrink-0 ${a.tone ?? 'text-teal-ink'}`} aria-hidden />
                <span className="min-w-0 text-sm"><span className="block truncate">{a.text}</span><span className="text-xs text-muted">{ago(a.at)}</span></span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <JourneyDetail journey={selected} onClose={() => setSelectedId(null)} audience="operations" />
    </>
  )
}

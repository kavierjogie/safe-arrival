import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Bell, BellRing, CheckCheck, CheckCircle2, Navigation, ShieldAlert, Users, Inbox } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { PageHeader } from '../components/layout/Layouts'
import { Button, DemoTag, EmptyState, Panel, Skeleton, StatCard, inputCls, inputW } from '../components/common/ui'
import { JourneyStatusBadge, SafetyBadge } from '../components/common/StatusBadges'
import JourneyDetail from '../components/journey/JourneyDetail'
import { ago } from '../components/journey/JourneyBits'
import { formatEta, guestRef, needsMonitoring } from '../lib/journeyUtils'

const NOTIF_ICON = { incident_reported: ShieldAlert, arrival_confirmed: CheckCircle2, journey_started: Navigation, eta_changed: Navigation }

export default function HotelDashboardPage() {
  const { journeys, hotels, notifications, driverById, markNotificationsRead, loading } = useDemo()
  const [hotelId, setHotelId] = useState('all')
  const [filter, setFilter] = useState('active')
  const [selectedId, setSelectedId] = useState(null)

  const mine = (hid) => hotelId === 'all' ? Boolean(hid) : hid === hotelId
  const shared = journeys.filter((j) => j.share_enabled && j.share_target === 'hotel' && mine(j.hotel_id))
  const rows = (filter === 'active' ? shared.filter(needsMonitoring) : filter === 'alerts' ? shared.filter((j) => ['incident', 'alert'].includes(j.safety_status)) : shared)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  const notes = notifications.filter((n) => n.recipient_type === 'hotel' && mine(n.recipient_id)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const unread = notes.filter((n) => !n.read_at)

  // Toast newly arriving notifications (realtime or cross-tab demo sync).
  const seen = useRef(null)
  useEffect(() => {
    if (loading) return
    const all = notifications.filter((n) => n.recipient_type === 'hotel')
    if (seen.current === null) { seen.current = new Set(all.map((n) => n.id)); return }
    for (const n of all) {
      if (seen.current.has(n.id)) continue
      seen.current.add(n.id)
      if (hotelId !== 'all' && n.recipient_id !== hotelId) continue
      const fn = n.notification_type === 'incident_reported' ? toast.error : n.notification_type === 'arrival_confirmed' ? toast.success : toast.info
      fn(n.title, { description: n.message })
    }
  }, [notifications, loading, hotelId])

  const today = new Date().toDateString()
  const stats = {
    arriving: shared.filter((j) => ['awaiting_transport', 'driver_assigned', 'driver_confirmed'].includes(j.journey_status)).length,
    active: shared.filter((j) => ['picked_up', 'on_route', 'arrived', 'safety_check_pending'].includes(j.journey_status)).length,
    arrived: shared.filter((j) => j.safety_status === 'safe' && new Date(j.completed_at).toDateString() === today).length,
    alerts: shared.filter((j) => ['incident', 'alert'].includes(j.safety_status)).length,
  }

  const selected = journeys.find((j) => j.id === selectedId)

  return (
    <>
      <PageHeader title="Guest arrivals" subtitle="Guests who chose to share their airport journey with your property.">
        <DemoTag />
        <label className="sr-only" htmlFor="hotel-select">Viewing as hotel</label>
        <select id="hotel-select" value={hotelId} onChange={(e) => setHotelId(e.target.value)} className={`${inputW('w-auto')}`}>
          <option value="all">All partner hotels (demo)</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading ? [1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-24" />) : <>
          <StatCard label="Guests arriving" value={stats.arriving} icon={Users} tone="navy" hint="Awaiting pickup" />
          <StatCard label="Active journeys" value={stats.active} icon={Navigation} tone="teal" hint="Picked up or on route" />
          <StatCard label="Arrived safely" value={stats.arrived} icon={CheckCircle2} tone="green" hint="Today" />
          <StatCard label="Safety alerts" value={stats.alerts} icon={ShieldAlert} tone={stats.alerts ? 'red' : 'green'} hint={stats.alerts ? 'Needs attention' : 'All clear'} />
        </>}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Guest journeys" action={
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs" role="tablist" aria-label="Filter journeys">
            {[['active', 'Active'], ['alerts', 'Alerts'], ['all', 'All']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`rounded-md px-2.5 py-1 font-medium ${filter === k ? 'bg-white shadow-sm' : 'text-muted'}`}>{l}</button>
            ))}
          </div>
        }>
          {loading ? <div className="space-y-2 p-4">{[1, 2, 3].map((k) => <Skeleton key={k} className="h-10" />)}</div>
            : rows.length === 0 ? <EmptyState icon={Inbox} title="No shared journeys here">When a guest shares their trip in the WhatsApp demo, it appears here instantly.</EmptyState>
            : (
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap min-w-[820px] text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr className="border-b border-slate-100">{['Guest', 'Destination', 'Driver', 'Vehicle reg.', 'ETA', 'Journey status', 'Last update', 'Safety'].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((j) => {
                      const d = driverById(j.driver_id)
                      return (
                        <tr key={j.id} className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${j.safety_status === 'incident' ? 'bg-alert/5' : ''}`} onClick={() => setSelectedId(j.id)}>
                          <td className="px-4 py-3"><button className="text-left font-medium hover:underline" onClick={(e) => { e.stopPropagation(); setSelectedId(j.id) }}>{guestRef(j)}</button><p className="font-mono text-[11px] text-muted">{j.journey_reference}</p></td>
                          <td className="px-4 py-3">{j.destination}</td>
                          <td className="px-4 py-3">{d?.full_name ?? <span className="text-muted">—</span>}</td>
                          <td className="px-4 py-3 font-mono">{d?.registration_number ?? '—'}</td>
                          <td className="px-4 py-3 tabular-nums">{formatEta(j)}</td>
                          <td className="px-4 py-3"><JourneyStatusBadge status={j.journey_status} /></td>
                          <td className="px-4 py-3 text-muted">{ago(j.updated_at)}</td>
                          <td className="px-4 py-3"><SafetyBadge status={j.safety_status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </Panel>

        <Panel title={<span className="flex items-center gap-2">{unread.length ? <BellRing className="size-4 text-amber-ink" aria-hidden /> : <Bell className="size-4" aria-hidden />}Notifications {unread.length > 0 && <span className="rounded-full bg-alert px-1.5 text-[11px] text-white">{unread.length}</span>}</span>}
          action={unread.length > 0 && <Button size="sm" variant="ghost" onClick={() => markNotificationsRead(unread.map((n) => n.id))}><CheckCheck className="size-4" aria-hidden />Mark read</Button>}>
          {notes.length === 0 ? <EmptyState icon={Bell} title="No notifications yet" /> : (
            <ul className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto" aria-live="polite">
              {notes.slice(0, 30).map((n) => {
                const Icon = NOTIF_ICON[n.notification_type] ?? Bell
                const tone = n.notification_type === 'incident_reported' ? 'text-alert-ink' : n.notification_type === 'arrival_confirmed' ? 'text-safe-ink' : 'text-teal-ink'
                return (
                  <li key={n.id}>
                    <button className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.read_at ? '' : 'bg-teal/5'}`} onClick={() => { if (n.journey_id) setSelectedId(n.journey_id); if (!n.read_at) markNotificationsRead([n.id]) }}>
                      <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden />
                      <span className="min-w-0"><span className="block text-sm font-medium">{n.title}{!n.read_at && <span className="sr-only"> (unread)</span>}</span><span className="block text-xs text-muted">{n.message}</span><span className="block text-[11px] text-muted">{ago(n.created_at)}</span></span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      <JourneyDetail journey={selected} onClose={() => setSelectedId(null)} audience="hotel" />
    </>
  )
}

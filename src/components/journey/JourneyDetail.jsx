import { useState } from 'react'
import { format } from 'date-fns'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useDemo } from '../../context/DemoContext'
import { JourneyStatusBadge, SafetyBadge, SeverityBadge, IncidentStatusBadge } from '../common/StatusBadges'
import { ConfirmDialog, Modal } from '../common/ui'
import DriverCard from '../driver/DriverCard'
import JourneyMap from './JourneyMap'
import { JourneyTimeline, RouteProgress, TrackingLink } from './JourneyBits'
import { formatEta, guestRef, INCIDENT_CATEGORIES } from '../../lib/journeyUtils'
import { rand } from '../../lib/fareEstimator'

const t = (iso) => (iso ? format(new Date(iso), 'd MMM, HH:mm') : '—')

/** Slide-over with full journey details (hotel + operations). */
export default function JourneyDetail({ journey, onClose, audience = 'hotel' }) {
  const { driverById, journey_updates, incidents } = useDemo()
  const [reveal, setReveal] = useState(false)
  const [ask, setAsk] = useState(false)
  if (!journey) return <Modal open={false} onClose={onClose} title="" drawer />
  const j = journey
  const driver = driverById(j.driver_id)
  const updates = journey_updates.filter((u) => u.journey_id === j.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const linked = incidents.filter((i) => i.journey_id === j.id)

  const info = [
    ['Guest', guestRef(j)], ['Destination', j.destination], ['Pickup', j.pickup_location],
    ['Departure', t(j.started_at)], ['Estimated arrival', formatEta(j) === 'Arrived' ? t(j.actual_arrival) : formatEta(j)],
    ['Estimated fare', `${rand(j.fare_min)}–${rand(j.fare_max)} (demo)`], ['Created', t(j.created_at)],
  ]

  return (
    <Modal open onClose={() => { setReveal(false); onClose() }} title={`Journey ${j.journey_reference}`} drawer>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2"><JourneyStatusBadge status={j.journey_status} /><SafetyBadge status={j.safety_status} /></div>

        {linked.length > 0 && (
          <div className="space-y-2 rounded-xl border border-alert/30 bg-alert/5 p-3">
            <p className="text-sm font-semibold text-alert-ink">Safety alert</p>
            {linked.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono font-semibold">{i.case_reference}</span><span>{INCIDENT_CATEGORIES[i.category]}</span>
                <SeverityBadge severity={i.severity} /><IncidentStatusBadge status={i.incident_status} />
              </div>
            ))}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {info.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}
        </dl>

        {driver ? <DriverCard driver={driver} /> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-muted">No driver assigned yet.</p>}

        {j.verification_code && driver && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 text-sm"><KeyRound className="size-4 text-muted" aria-hidden />
              <span>Verification code: <span className="font-mono font-semibold tracking-widest">{reveal ? j.verification_code : '••••'}</span></span>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-teal-ink hover:underline" onClick={() => (reveal ? setReveal(false) : setAsk(true))}>
              {reveal ? <><EyeOff className="size-4" aria-hidden />Hide</> : <><Eye className="size-4" aria-hidden />Reveal for check-in</>}
            </button>
          </div>
        )}

        <div className="space-y-3">
          <RouteProgress journey={j} />
          <JourneyMap journey={j} height="h-60" />
        </div>
        {j.share_enabled && <div><p className="mb-1 text-xs font-medium text-muted">Tracking link</p><TrackingLink journey={j} /></div>}

        <div>
          <h3 className="mb-2 text-sm font-semibold">Journey timeline</h3>
          <JourneyTimeline updates={updates} />
        </div>
      </div>
      <ConfirmDialog open={ask} onClose={() => setAsk(false)} onConfirm={() => setReveal(true)} title="Reveal verification code?"
        message={`Only reveal the code when ${audience === 'hotel' ? 'front-desk staff need to verify the driver at drop-off' : 'investigating a verification issue'}. Never share it with the driver first — the driver should say it.`} confirmLabel="Reveal code" />
    </Modal>
  )
}

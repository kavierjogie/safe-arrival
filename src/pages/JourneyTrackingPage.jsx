import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { AlertOctagon, Car, Clock, MapPin, Siren, User } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { journeyService } from '../services/journeyService'
import { formatEta, guestRef } from '../lib/journeyUtils'
import { JourneyStatusBadge, SafetyBadge } from '../components/common/StatusBadges'
import { Button, ConnectionIndicator, EmptyState, Logo, Skeleton } from '../components/common/ui'
import JourneyMap from '../components/journey/JourneyMap'
import { RouteProgress, ago } from '../components/journey/JourneyBits'
import EmergencyPanel from '../components/safety/EmergencyPanel'

/**
 * Public tracking view. Exposes only fields needed to follow the journey —
 * never phone numbers, verification codes or incident descriptions.
 */
function usePublicJourney(token) {
  const { mode, journeys, driverById, loading } = useDemo()
  const [remote, setRemote] = useState(undefined)

  useEffect(() => {
    if (mode !== 'supabase') return
    let live = true
    const load = () => journeyService.getShared(token).then((r) => live && setRemote(r)).catch(() => live && setRemote(null))
    load()
    const iv = setInterval(load, 5000)
    return () => { live = false; clearInterval(iv) }
  }, [mode, token])

  if (mode === 'supabase') return { journey: remote, loading: remote === undefined }
  const j = journeys.find((x) => x.share_token === token && x.share_enabled)
  if (!j) return { journey: null, loading }
  const d = driverById(j.driver_id)
  const { verification_code: _code, tourist_phone: _phone, ...safe } = j
  return {
    loading: false,
    journey: { ...safe, driver_name: d?.full_name, vehicle: d ? `${d.vehicle_colour} ${d.vehicle_make} ${d.vehicle_model}` : null, registration_number: d?.registration_number },
  }
}

export default function JourneyTrackingPage() {
  const { id } = useParams()
  const { journey: j, loading } = usePublicJourney(id)
  const [help, setHelp] = useState(false)

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3"><Logo light /><ConnectionIndicator light /></div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        {loading ? (
          <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-64" /><Skeleton className="h-32" /></div>
        ) : !j ? (
          <div className="rounded-xl border border-slate-200 bg-white">
            <EmptyState icon={MapPin} title="Tracking link not found">
              This link may have expired or sharing was turned off. In Demo Mode, links work in the same browser that created the journey — connect Supabase to share across devices.
            </EmptyState>
            <div className="pb-6 text-center"><Button as={Link} to="/demo" variant="outline">Open tourist demo</Button></div>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Shared journey · {j.journey_reference}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{guestRef(j)} is travelling to {j.destination}</h1>
              <div className="mt-2 flex flex-wrap gap-2"><JourneyStatusBadge status={j.journey_status} /><SafetyBadge status={j.safety_status} /></div>
            </div>

            {j.journey_status === 'incident_reported' && (
              <div className="flex gap-2 rounded-xl bg-alert/10 p-3 text-sm text-alert-ink" role="alert"><AlertOctagon className="size-5 shrink-0" aria-hidden />The traveller reported a problem. The Safe Arrival team has a case open (demo).</div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[[Clock, 'ETA', formatEta(j)], [Car, 'Departure', j.started_at ? `Left ${format(new Date(j.started_at), 'HH:mm')}` : 'Not yet'], [User, 'Driver', j.driver_name ?? 'Not assigned'], [MapPin, 'Registration', j.registration_number ?? '—']].map(([Icon, k, v]) => (
                <div key={k} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="flex items-center gap-1 text-xs text-muted"><Icon className="size-3.5" aria-hidden />{k}</p>
                  <p className={`mt-1 font-semibold ${k === 'Registration' ? 'font-mono' : ''}`}>{v}</p>
                </div>
              ))}
            </div>
            {j.vehicle && <p className="text-sm text-muted">Vehicle: <span className="font-medium text-navy">{j.vehicle}</span></p>}

            <div className="rounded-xl border border-slate-200 bg-white p-4"><RouteProgress journey={j} /></div>
            <JourneyMap journey={j} height="h-80" />
            <p className="text-xs text-muted">Positions are simulated along a demo route — this is not live GPS tracking. Last update {ago(j.updated_at)}.</p>

            <Button variant="danger" size="lg" className="w-full" onClick={() => setHelp(true)}><Siren className="size-5" aria-hidden />Emergency assistance</Button>
            <EmergencyPanel open={help} onClose={() => setHelp(false)} journeyId={j.id} showChecklist={false} />
          </>
        )}
      </main>
    </div>
  )
}

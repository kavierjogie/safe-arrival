import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle2, Circle, ExternalLink, MapPin, MonitorCog, Play, Receipt, ShieldCheck, Siren, Smartphone } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { useTouristChat } from '../hooks/useTouristChat'
import { PublicHeader } from '../components/layout/Layouts'
import ChatWindow from '../components/chat/ChatWindow'
import AirportWelcome from '../components/chat/AirportWelcome'
import DriverCard from '../components/driver/DriverCard'
import JourneyMap from '../components/journey/JourneyMap'
import { RouteProgress, TrackingLink } from '../components/journey/JourneyBits'
import { JourneyStatusBadge, SafetyBadge } from '../components/common/StatusBadges'
import { Button, Panel, EmptyState } from '../components/common/ui'
import EmergencyPanel from '../components/safety/EmergencyPanel'
import ScamReportDialog from '../components/safety/ScamReportDialog'
import SafetyChecklist from '../components/safety/SafetyChecklist'
import { rand } from '../lib/fareEstimator'

function Row({ label, children }) {
  return <div className="flex items-start justify-between gap-3 py-1.5 text-sm"><dt className="text-muted">{label}</dt><dd className="text-right font-medium">{children}</dd></div>
}

function JourneyPanel({ engine, journey, onEmergency }) {
  const { driverById, hotelById } = useDemo()
  const driver = journey && driverById(journey.driver_id)
  const hotel = journey && hotelById(journey.hotel_id)
  const canAdvance = engine.chat.step === 'trip' && engine.nextTripLabel && !engine.chat.typing

  if (!journey) {
    return (
      <Panel title="Journey summary">
        <EmptyState icon={MapPin} title="No journey yet">Start the conversation and choose a destination. Fare, driver, hotel and tracking details will appear here.</EmptyState>
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      <Panel title="Journey summary" action={<span className="font-mono text-xs text-muted">{journey.journey_reference}</span>} bodyClass="px-4 py-2">
        <dl className="divide-y divide-slate-100">
          <Row label="Destination">{journey.destination}</Row>
          <Row label="Estimated fare"><span className="inline-flex items-center gap-1"><Receipt className="size-3.5 text-muted" aria-hidden />{rand(journey.fare_min)}–{rand(journey.fare_max)}</span></Row>
          <Row label="Status"><JourneyStatusBadge status={journey.journey_status} /></Row>
          <Row label="Safety"><SafetyBadge status={journey.safety_status} /></Row>
          <Row label="Hotel connection">
            {journey.share_enabled
              ? <span className="inline-flex items-center gap-1 text-safe-ink"><CheckCircle2 className="size-4" aria-hidden />{journey.share_target === 'hotel' ? `Shared with ${hotel?.name ?? 'hotel'}` : 'Shared via link'}</span>
              : <span className="inline-flex items-center gap-1 text-muted"><Circle className="size-4" aria-hidden />Not shared</span>}
          </Row>
        </dl>
      </Panel>

      {driver && (
        <Panel title="Your driver" bodyClass="p-3">
          <DriverCard driver={driver} code={journey.verification_code} />
        </Panel>
      )}

      {driver && (
        <Panel title="Simulated journey" bodyClass="space-y-3 p-3"
          action={canAdvance && <Button size="sm" variant="dark" onClick={engine.advanceTrip}><Play className="size-3.5" aria-hidden />{engine.nextTripLabel.replace('▶ Simulate: ', '')}</Button>}>
          <RouteProgress journey={journey} />
          <JourneyMap journey={journey} height="h-56" />
          {journey.share_enabled && <TrackingLink journey={journey} />}
          {!canAdvance && engine.chat.step !== 'trip' && journey.journey_status === 'awaiting_transport' && <p className="text-xs text-muted">Confirm driver details and choose a sharing option to start the trip simulation.</p>}
        </Panel>
      )}

      <Panel title="Safety" bodyClass="space-y-3 p-3">
        <SafetyChecklist compact />
        <Button variant="danger" className="w-full" onClick={onEmergency}><Siren className="size-4" aria-hidden />Emergency assistance</Button>
      </Panel>
    </div>
  )
}

export default function TouristDemoPage() {
  const [emergency, setEmergency] = useState(false)
  const [scam, setScam] = useState(false)
  const engine = useTouristChat({ onEmergency: () => setEmergency(true), onReportScam: () => setScam(true) })
  const { chat, journey } = engine

  return (
    <div className="pb-24">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-2.5 py-1 text-xs font-semibold text-[#0d6b37]"><Smartphone className="size-3.5" aria-hidden />WhatsApp Experience Preview</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tourist journey simulator</h1>
            <p className="text-sm text-muted">A simulated chat — nothing is sent through WhatsApp. Real rollout would use the WhatsApp Business Cloud API.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to="/hotel" variant="outline" size="sm"><Building2 className="size-4" aria-hidden />Hotel view<ExternalLink className="size-3" aria-hidden /></Button>
            <Button as={Link} to="/operations" variant="outline" size="sm"><MonitorCog className="size-4" aria-hidden />Operations view</Button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
          <div className="mx-auto w-full max-w-[400px] lg:sticky lg:top-4">
            <div className="rounded-[2.4rem] bg-navy p-2.5 shadow-2xl">
              <div className="relative h-[min(760px,calc(100dvh-140px))] min-h-[560px] overflow-hidden rounded-[2rem]">
                {chat.started
                  ? <ChatWindow engine={engine} onEmergency={() => setEmergency(true)} />
                  : <AirportWelcome onStart={engine.start} defaultName={chat.touristName} />}
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="size-3.5" aria-hidden />Fictional drivers and illustrative fares for demonstration.</p>
          </div>

          <JourneyPanel engine={engine} journey={journey} onEmergency={() => setEmergency(true)} />
        </div>
      </div>

      <EmergencyPanel open={emergency} onClose={() => setEmergency(false)} journeyId={journey?.id ?? null} onReportScam={() => setScam(true)} showChecklist={false} />
      <ScamReportDialog open={scam} onClose={() => setScam(false)} />
    </div>
  )
}

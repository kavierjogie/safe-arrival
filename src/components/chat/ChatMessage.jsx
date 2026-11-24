import { format } from 'date-fns'
import { AlertTriangle, CheckCheck, CheckCircle2, Info, PartyPopper } from 'lucide-react'
import { useDemo } from '../../context/DemoContext'
import { FARE_DISCLAIMER, rand } from '../../lib/fareEstimator'
import { formatEta } from '../../lib/journeyUtils'
import DriverCard from '../driver/DriverCard'
import { TrackingLink } from '../journey/JourneyBits'
import SafetyChecklist from '../safety/SafetyChecklist'
import { EmergencyNumbers } from '../safety/EmergencyPanel'
import { SAFETY_TIPS } from '../../data/demoData'

const Time = ({ at, me }) => (
  <span className="float-right ml-3 mt-1.5 flex items-center gap-0.5 text-[10px] text-slate-500">
    {format(new Date(at), 'HH:mm')}
    {me && <CheckCheck className="size-3.5 text-sky-500" aria-label="Read" />}
  </span>
)

function FareCard({ data }) {
  const { fare, destination, custom } = data
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fare estimate · demo</p>
      <p className="font-semibold">{destination}</p>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[['Fare range', `${rand(fare.min)}–${rand(fare.max)}`], ['Travel time', `${fare.minutes[0]}–${fare.minutes[1]} min`], ['Distance', `≈${fare.km} km`]].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-slate-50 px-1.5 py-2"><p className="text-[10px] text-muted">{k}</p><p className="text-sm font-semibold">{v}</p></div>
        ))}
      </div>
      <table className="w-full text-xs">
        <caption className="sr-only">Illustrative fare breakdown</caption>
        <tbody>
          {fare.breakdown.map((b) => <tr key={b.label}><td className="py-0.5 text-slate-600">{b.label}</td><td className="text-right tabular-nums">{rand(b.amount)}</td></tr>)}
          <tr className="border-t border-slate-200 font-semibold"><td className="pt-1">Estimated fare</td><td className="pt-1 text-right tabular-nums">{rand(fare.estimate)}</td></tr>
        </tbody>
      </table>
      {custom && <p className="text-xs text-slate-600">Matched to the {fare.areaLabel} area for this estimate.</p>}
      <p className="flex gap-1.5 rounded-md bg-amber/10 p-2 text-[11px] leading-snug text-amber-ink"><Info className="mt-px size-3.5 shrink-0" aria-hidden />{FARE_DISCLAIMER} Not a guaranteed or live price.</p>
    </div>
  )
}

function ShareCard({ data }) {
  const { chat, journeys } = useDemo()
  const j = journeys.find((x) => x.id === chat.journeyId)
  if (!j) return null
  const rows = data.target === 'hotel'
    ? [['Hotel notified', 'Yes'], ['Journey tracking', 'Active'], ['ETA', formatEta(j) === '—' ? `${Math.round(j.estimated_duration_min)} min` : formatEta(j)], ['Safety status', 'On track']]
    : [['Tracking link', 'Ready to share'], ['Journey tracking', 'Active'], ['Safety status', 'On track']]
  return (
    <div className="space-y-2">
      <ul className="space-y-1 text-sm">
        {rows.map(([k, v]) => <li key={k} className="flex items-center justify-between gap-3"><span className="text-slate-600">{k}</span><span className="flex items-center gap-1 font-medium"><CheckCircle2 className="size-3.5 text-safe" aria-hidden />{v}</span></li>)}
      </ul>
      <TrackingLink journey={j} />
    </div>
  )
}

function Tips() {
  return (
    <div>
      <p className="mb-1.5 font-semibold">Safety tips for arriving visitors</p>
      <ul className="list-disc space-y-1 pl-4 text-sm">{SAFETY_TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
      <p className="mt-2 text-[11px] text-muted">Based on sample demo reports, not official statistics.</p>
    </div>
  )
}

const Disclaimer = () => (
  <p className="flex gap-2 text-[13px] leading-snug text-alert-ink"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />This prototype does not contact police, emergency services, Uber, Bolt, or a live support agent. If you are in immediate danger, contact emergency services directly.</p>
)

export default function ChatMessage({ m }) {
  const { chat, driverById, journeys } = useDemo()
  const me = m.from === 'user'
  const j = journeys.find((x) => x.id === chat.journeyId)

  let body
  switch (m.kind) {
    case 'fare': body = <FareCard data={m.data} />; break
    case 'driver': body = <div className="-mx-1"><DriverCard driver={driverById(m.data.driverId)} code={m.data.code} /></div>; break
    case 'share': body = <ShareCard data={m.data} />; break
    case 'checklist': body = <SafetyChecklist compact />; break
    case 'tips': body = <Tips />; break
    case 'disclaimer': body = <Disclaimer />; break
    case 'emergency': body = (
      <div className="space-y-2">
        <p className="font-semibold text-alert-ink">If you are in immediate danger, call emergency services now.</p>
        <EmergencyNumbers />
        <p className="text-[11px] text-muted">Tap to open your dialer. This prototype does not call anyone for you.</p>
      </div>
    ); break
    case 'arrival': body = (
      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-safe-ink"><PartyPopper className="size-4" aria-hidden />Journey completed</p>
        {['Safe arrival confirmed', ...(j?.share_enabled && j?.hotel_id ? ['Hotel notified'] : [])].map((t) => <p key={t} className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-safe" aria-hidden />{t}</p>)}
      </div>
    ); break
    default: body = <p className="whitespace-pre-line text-[14px] leading-snug">{m.text}</p>
  }

  const wide = m.kind !== 'text'
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative rounded-lg px-2.5 pb-1.5 pt-2 text-navy shadow-sm ${wide ? 'w-[88%] max-w-sm' : 'max-w-[85%]'} ${me ? 'rounded-tr-none bg-bubble-out' : 'rounded-tl-none bg-white'}`}>
        {body}
        <Time at={m.at} me={me} />
        <span className="clear-both block" />
      </div>
    </div>
  )
}

import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Building2, CheckCircle2, Circle, ListChecks, MessageCircle, MonitorCog, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useDemo } from '../../context/DemoContext'
import { ConfirmDialog, Modal, Button } from '../common/ui'

const SCENES = [
  ['Tourist lands', 'Open the Tourist demo and tap "Start WhatsApp Conversation".', (c) => c.started],
  ['Enter destination', 'Choose a hotel — the fare estimate and safety advice appear.', (c, j) => Boolean(j)],
  ['Verified driver', 'Request a verified driver: vehicle, registration and verification code.', (c, j) => Boolean(j?.driver_id)],
  ['Hotel notified', 'Share with hotel, then open the Hotel view — the guest appears.', (c, j) => Boolean(j?.share_enabled)],
  ['Journey monitoring', 'Use the Simulate buttons: driver confirmed → pickup → on route → arrived.', (c, j) => ['on_route', 'safety_check_pending', 'completed'].includes(j?.journey_status)],
  ['Safe arrival', 'Tap "Yes, I arrived safely" and show the hotel dashboard update.', (c, j) => j?.journey_status === 'completed'],
]

const link = ({ isActive }) => `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium sm:text-sm ${isActive ? 'bg-teal text-white' : 'text-white/85 hover:bg-white/10'}`

/** Floating presentation controls: switch views, guided script, reset. */
export default function PresenterBar() {
  const { chat, journeys, resetDemo } = useDemo()
  const [confirm, setConfirm] = useState(false)
  const [guide, setGuide] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const j = journeys.find((x) => x.id === chat.journeyId)

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)} className="fixed bottom-3 right-3 z-[500] flex items-center gap-1 rounded-full bg-navy px-3 py-2 text-xs font-medium text-white shadow-lg" aria-label="Show presenter controls">
        <ChevronUp className="size-4" aria-hidden />Presenter
      </button>
    )
  }

  return (
    <>
      <nav aria-label="Presenter controls" className="fixed inset-x-2 bottom-2 z-[500] mx-auto flex max-w-fit items-center gap-1 overflow-x-auto rounded-xl bg-navy/95 p-1.5 shadow-xl ring-1 ring-white/10 backdrop-blur">
        <NavLink to="/demo" className={link}><MessageCircle className="size-4" aria-hidden /><span className="hidden sm:inline">Tourist</span><span className="sr-only sm:hidden">Tourist</span></NavLink>
        <NavLink to="/hotel" className={link}><Building2 className="size-4" aria-hidden /><span className="hidden sm:inline">Hotel</span><span className="sr-only sm:hidden">Hotel</span></NavLink>
        <NavLink to="/operations" end={false} className={link}><MonitorCog className="size-4" aria-hidden /><span className="hidden sm:inline">Operations</span><span className="sr-only sm:hidden">Operations</span></NavLink>
        <span className="mx-1 h-5 w-px bg-white/20" aria-hidden />
        <button onClick={() => setGuide(true)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10 sm:text-sm"><ListChecks className="size-4" aria-hidden /><span className="hidden sm:inline">Guided demo</span></button>
        <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 sm:text-sm"><RotateCcw className="size-4" aria-hidden />Reset<span className="hidden sm:inline">&nbsp;Demo</span></button>
        <button onClick={() => setCollapsed(true)} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10" aria-label="Hide presenter controls"><ChevronDown className="size-4" /></button>
      </nav>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={resetDemo} title="Reset the demo?"
        message="This clears the tourist chat, the demo journey, new incidents and reports, and returns the hotel and operations dashboards to their seed data." confirmLabel="Reset demo" variant="danger" />

      <Modal open={guide} onClose={() => setGuide(false)} title="Guided 3-minute demo">
        <ol className="space-y-3">
          {SCENES.map(([title, tip, done], i) => {
            const ok = done(chat, j)
            return (
              <li key={title} className="flex gap-3">
                {ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-safe" aria-label="Done" /> : <Circle className="mt-0.5 size-5 shrink-0 text-slate-300" aria-label="Not done" />}
                <div><p className="text-sm font-semibold">Scene {i + 1} — {title}</p><p className="text-sm text-muted">{tip}</p></div>
              </li>
            )
          })}
        </ol>
        <div className="mt-4 rounded-lg bg-canvas p-3 text-sm">
          <p className="font-semibold">Alternative: incident flow</p>
          <p className="text-muted">Reset, run to the trip stage, choose "I need help" → a case number is generated and appears on Operations › Incidents and as a hotel safety alert.</p>
        </div>
        <div className="mt-4 flex justify-end"><Button as={NavLink} to="/demo" onClick={() => setGuide(false)}>Go to tourist demo</Button></div>
      </Modal>
    </>
  )
}

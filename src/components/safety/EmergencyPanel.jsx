import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Ambulance, Car, Flag, MapPinOff, Phone, Siren } from 'lucide-react'
import { useDemo } from '../../context/DemoContext'
import { INCIDENT_CATEGORIES } from '../../lib/journeyUtils'
import { Button, Field, Modal, inputCls } from '../common/ui'
import SafetyChecklist from './SafetyChecklist'

export const EMERGENCY_NUMBERS = [
  { label: 'Police emergency', number: '10111', icon: Siren },
  { label: 'Ambulance', number: '10177', icon: Ambulance },
  { label: 'Emergency from a mobile', number: '112', icon: Phone },
]

export function EmergencyNumbers() {
  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {EMERGENCY_NUMBERS.map(({ label, number, icon: Icon }) => (
        <li key={number}>
          <a href={`tel:${number}`} className="flex items-center gap-3 rounded-xl border border-alert/30 bg-alert/5 px-3 py-2.5 hover:bg-alert/10">
            <Icon className="size-5 text-alert-ink" aria-hidden />
            <span><span className="block text-xs text-slate-600">{label}</span><span className="text-lg font-bold tabular-nums text-alert-ink">{number}</span></span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Safety help panel. Information only — the prototype never calls anyone. */
export default function EmergencyPanel({ open, onClose, journeyId = null, onReportScam, showChecklist = true }) {
  const { createIncident } = useDemo()
  const [category, setCategory] = useState(null)
  const [desc, setDesc] = useState('')
  const [created, setCreated] = useState(null)

  const close = () => { setCategory(null); setDesc(''); setCreated(null); onClose() }
  const submit = (e) => {
    e.preventDefault()
    const inc = createIncident({ journeyId, category, description: desc.slice(0, 1000) })
    setCreated(inc)
    toast.success(`Simulated report created: ${inc.case_reference}`)
  }

  const quick = [
    ['Tourist lost', MapPinOff, 'lost_tourist'],
    ['Transport issue', Car, 'vehicle_mismatch'],
    ['Report an incident', Flag, 'other'],
  ]

  return (
    <Modal open={open} onClose={close} title="Safety help" wide>
      <div className="space-y-5">
        <div className="flex gap-3 rounded-xl bg-alert/10 p-3 text-sm text-alert-ink" role="alert">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p><strong>If you are in immediate danger, call emergency services now.</strong> Don't rely on this chat in a genuine emergency.</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Emergency numbers (South Africa)</h3>
          <EmergencyNumbers />
          <p className="mt-2 text-xs text-muted">Numbers are shown for information. Tapping opens your phone dialer — this prototype does not call any service automatically.</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Get help with something else</h3>
          {created ? (
            <div className="rounded-xl border border-safe/30 bg-safe/5 p-4 text-sm">
              <p className="font-semibold">Simulated report created</p>
              <p className="mt-1">Case reference <strong className="tabular-nums">{created.case_reference}</strong> — visible on the demo operations dashboard.</p>
              <p className="mt-2 text-xs text-muted">This prototype does not contact police, emergency services, Uber, Bolt, or a live support agent.</p>
            </div>
          ) : category ? (
            <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <Field label="What happened?">
                <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {Object.entries(INCIDENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Details (optional)">
                <textarea className={inputCls} rows={3} maxLength={1000} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Where are you, and what's wrong?" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCategory(null)}>Back</Button>
                <Button type="submit" variant="danger">Create simulated report</Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <a href="tel:10111" className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"><Siren className="size-4 text-alert-ink" aria-hidden />Police assistance</a>
              <a href="tel:10177" className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"><Ambulance className="size-4 text-alert-ink" aria-hidden />Medical emergency</a>
              {quick.map(([label, Icon, cat]) => (
                <button key={label} type="button" onClick={() => setCategory(cat)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-medium hover:bg-slate-50">
                  <Icon className="size-4 text-deep" aria-hidden />{label}
                </button>
              ))}
              {onReportScam && (
                <button type="button" onClick={() => { close(); onReportScam() }} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-medium hover:bg-slate-50">
                  <Flag className="size-4 text-amber-ink" aria-hidden />Report a scam
                </button>
              )}
            </div>
          )}
        </div>

        {showChecklist && <div className="rounded-xl border border-slate-200 p-4"><SafetyChecklist compact /></div>}
      </div>
    </Modal>
  )
}

import { Check } from 'lucide-react'
import { useDemo } from '../../context/DemoContext'

export const CHECKLIST = [
  'I know my destination.',
  'I have confirmed my transport provider.',
  'I have checked the vehicle registration.',
  'I have checked the vehicle model and colour.',
  'I have verified the driver using the provided code.',
  'I have shared my journey with someone I trust.',
  'I know how to contact emergency services.',
]

/** Personal pre-pickup checklist. Ticking items never marks a driver as verified. */
export default function SafetyChecklist({ compact = false }) {
  const { chat, setChat } = useDemo()
  const done = chat.checklist.filter(Boolean).length
  const toggle = (i) => setChat((c) => ({ ...c, checklist: c.checklist.map((v, k) => (k === i ? !v : v)) }))
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-navy">Pre-pickup checklist</span>
        <span className="text-muted" aria-live="polite">{done}/{CHECKLIST.length} done</span>
      </div>
      <div className="mb-3 h-1.5 rounded-full bg-slate-200" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={CHECKLIST.length} aria-label="Checklist progress">
        <div className="h-full rounded-full bg-safe transition-all" style={{ width: `${(done / CHECKLIST.length) * 100}%` }} />
      </div>
      <ul className={compact ? 'space-y-1' : 'space-y-1.5'}>
        {CHECKLIST.map((item, i) => (
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-slate-50">
              <input type="checkbox" className="peer sr-only" checked={chat.checklist[i]} onChange={() => toggle(i)} />
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-slate-400 bg-white peer-checked:border-safe peer-checked:bg-safe peer-focus-visible:ring-2 peer-focus-visible:ring-teal" aria-hidden>
                {chat.checklist[i] && <Check className="size-3 text-white" strokeWidth={3} />}
              </span>
              <span className={chat.checklist[i] ? 'text-muted line-through' : ''}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">This is your personal checklist. Ticking items does not verify a driver or vehicle.</p>
    </div>
  )
}

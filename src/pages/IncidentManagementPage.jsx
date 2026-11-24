import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { AlertOctagon, CheckCircle2, MessageSquarePlus, Search, XCircle } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { PageHeader } from '../components/layout/Layouts'
import { Button, ConfirmDialog, DemoTag, EmptyState, Field, Modal, Panel, inputCls, inputW } from '../components/common/ui'
import { IncidentStatusBadge, SeverityBadge, JourneyStatusBadge } from '../components/common/StatusBadges'
import { ago } from '../components/journey/JourneyBits'
import { INCIDENT_CATEGORIES, INCIDENT_STATUSES, SEVERITIES, SEVERITY_RANK } from '../lib/journeyUtils'

function IncidentDetail({ incident: i, onClose }) {
  const { incident_notes, journeys, updateIncident, addIncidentNote } = useDemo()
  const [note, setNote] = useState('')
  const [resolution, setResolution] = useState(i.resolution ?? '')
  const [pending, setPending] = useState(null)
  const notes = incident_notes.filter((n) => n.incident_id === i.id)
  const journey = journeys.find((j) => j.id === i.journey_id)

  const setStatus = (s) => {
    if (['resolved', 'closed'].includes(s)) return setPending(s)
    updateIncident(i.id, { incident_status: s })
    toast.success(`${i.case_reference} marked ${INCIDENT_STATUSES[s].toLowerCase()}`)
  }
  const submitNote = (e) => {
    e.preventDefault()
    if (note.trim().length < 2) return
    addIncidentNote(i.id, note.slice(0, 1000))
    setNote('')
    toast.success('Internal note added')
  }

  return (
    <Modal open onClose={onClose} title={`Incident ${i.case_reference}`} drawer>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2"><IncidentStatusBadge status={i.incident_status} /><SeverityBadge severity={i.severity} /></div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[['Category', INCIDENT_CATEGORIES[i.category]], ['Reported', format(new Date(i.created_at), 'd MMM yyyy, HH:mm')], ['Tourist', i.tourist_reference], ['Hotel notified', i.hotel_notified ? 'Yes' : 'No'], ['Journey', journey?.journey_reference ?? 'Not linked'], ['Last updated', ago(i.updated_at)]].map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
        {journey && <div className="flex items-center gap-2 text-sm"><span className="text-muted">Journey status:</span><JourneyStatusBadge status={journey.journey_status} /></div>}
        <div>
          <p className="text-xs text-muted">Description</p>
          <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm">{i.description || <span className="text-muted">No description provided yet.</span>}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select className={inputCls} value={i.incident_status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(INCIDENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={i.severity} onChange={(e) => { updateIncident(i.id, { severity: e.target.value }); toast.success('Priority updated') }}>
              {Object.entries(SEVERITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Resolution" hint="Shown on the incident record. Required to resolve or close.">
          <textarea className={inputCls} rows={2} value={resolution} maxLength={500} onChange={(e) => setResolution(e.target.value)} onBlur={() => resolution !== (i.resolution ?? '') && updateIncident(i.id, { resolution: resolution.trim() || null })} />
        </Field>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Internal notes</h3>
          {notes.length === 0 ? <p className="text-sm text-muted">No notes yet.</p> : (
            <ul className="space-y-2">
              {notes.map((n) => <li key={n.id} className="rounded-lg border border-slate-200 p-2.5 text-sm"><p>{n.note}</p><p className="mt-1 text-xs text-muted">Operations · {ago(n.created_at)}</p></li>)}
            </ul>
          )}
          <form onSubmit={submitNote} className="mt-3 flex gap-2">
            <label htmlFor="note" className="sr-only">Add internal note</label>
            <input id="note" className={inputCls} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" />
            <Button type="submit" disabled={note.trim().length < 2}><MessageSquarePlus className="size-4" aria-hidden />Add</Button>
          </form>
        </div>
      </div>

      <ConfirmDialog open={Boolean(pending)} onClose={() => setPending(null)}
        title={`Mark ${i.case_reference} as ${pending ? INCIDENT_STATUSES[pending].toLowerCase() : ''}?`}
        message={resolution.trim() ? `Resolution: "${resolution.trim()}"` : 'No resolution recorded — a default note will be saved. Add a resolution first for a clearer record.'}
        confirmLabel={pending === 'closed' ? 'Close incident' : 'Mark resolved'} variant="safe"
        onConfirm={() => {
          updateIncident(i.id, { incident_status: pending, resolution: resolution.trim() || 'Resolved by operations (demo).' })
          toast.success(`${i.case_reference} ${pending}`)
        }} />
    </Modal>
  )
}

export default function IncidentManagementPage() {
  const { incidents, journeys } = useDemo()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('open')
  const [cat, setCat] = useState('all')
  const [sev, setSev] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const ref = (id) => journeys.find((j) => j.id === id)?.journey_reference
  const rows = incidents
    .filter((i) => status === 'all' ? true : status === 'open' ? !['resolved', 'closed'].includes(i.incident_status) : i.incident_status === status)
    .filter((i) => cat === 'all' || i.category === cat)
    .filter((i) => sev === 'all' || i.severity === sev)
    .filter((i) => !q.trim() || [i.case_reference, i.description, i.tourist_reference, ref(i.journey_id), INCIDENT_CATEGORIES[i.category]].some((v) => v?.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || new Date(b.created_at) - new Date(a.created_at))
  const selected = incidents.find((i) => i.id === selectedId)

  return (
    <>
      <PageHeader title="Incident management" subtitle="Reports raised by tourists through chat, tracking links and the safety panel."><DemoTag>Sample incidents</DemoTag></PageHeader>
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted" aria-hidden />
            <input aria-label="Search incidents" className={`${inputCls} pl-8`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search case, description, journey…" /></div>
          <select aria-label="Status" className={`${inputW('w-auto')}`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open (new → investigating)</option><option value="all">All statuses</option>
            {Object.entries(INCIDENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Category" className={`${inputW('w-auto')}`} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>{Object.entries(INCIDENT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Severity" className={`${inputW('w-auto')}`} value={sev} onChange={(e) => setSev(e.target.value)}>
            <option value="all">All severities</option>{Object.entries(SEVERITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {rows.length === 0 ? <EmptyState icon={AlertOctagon} title="No incidents match these filters">Try "All statuses", or run the incident flow in the tourist demo.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap min-w-[1000px] text-sm">
              <thead className="text-left text-xs text-muted"><tr className="border-b border-slate-100">{['Case', 'Reported', 'Journey', 'Category', 'Severity', 'Description', 'Status', 'Hotel notified', 'Resolution'].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} onClick={() => setSelectedId(i.id)} className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${i.incident_status === 'new' ? 'bg-alert/5' : ''}`}>
                    <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); setSelectedId(i.id) }} className="font-mono font-semibold hover:underline">{i.case_reference}</button></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{ago(i.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{ref(i.journey_id) ?? '—'}</td>
                    <td className="px-4 py-3">{INCIDENT_CATEGORIES[i.category]}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={i.severity} /></td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-slate-600">{i.description || '—'}</td>
                    <td className="px-4 py-3"><IncidentStatusBadge status={i.incident_status} /></td>
                    <td className="px-4 py-3">{i.hotel_notified ? <span className="inline-flex items-center gap-1 text-safe-ink"><CheckCircle2 className="size-4" aria-hidden />Yes</span> : <span className="inline-flex items-center gap-1 text-muted"><XCircle className="size-4" aria-hidden />No</span>}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{i.resolution ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {selected && <IncidentDetail key={selected.id} incident={selected} onClose={() => setSelectedId(null)} />}
    </>
  )
}

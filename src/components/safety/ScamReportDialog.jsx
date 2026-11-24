import { useState } from 'react'
import { toast } from 'sonner'
import { useDemo } from '../../context/DemoContext'
import { SCAM_CATEGORIES } from '../../lib/journeyUtils'
import { Button, Field, Modal, inputCls } from '../common/ui'

const blank = { category: 'fake_ridehailing', location: '', description: '', severity: 'medium' }

export default function ScamReportDialog({ open, onClose }) {
  const { createScamReport } = useDemo()
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const location = form.location.trim()
    const description = form.description.trim()
    if (location.length < 3 || description.length < 10) return setError('Please add a location and at least 10 characters describing what happened.')
    createScamReport({ ...form, location: location.slice(0, 120), description: description.slice(0, 1000) })
    toast.success('Thanks — your anonymous report was added (demo).')
    setForm(blank)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Report a scam (anonymous)">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Type of scam">
          <select className={inputCls} value={form.category} onChange={set('category')}>
            {Object.entries(SCAM_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Where did it happen?">
          <input className={inputCls} value={form.location} onChange={set('location')} maxLength={120} placeholder="e.g. CPT Airport — arrivals hall" required />
        </Field>
        <Field label="What happened?" hint="Don't include names, phone numbers or other personal details.">
          <textarea className={inputCls} rows={4} value={form.description} onChange={set('description')} maxLength={1000} required />
        </Field>
        <Field label="How serious was it?">
          <select className={inputCls} value={form.severity} onChange={set('severity')}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Field>
        {error && <p className="text-sm text-alert-ink" role="alert">{error}</p>}
        <p className="text-xs text-muted">Reports are anonymous and stored as unverified until reviewed. This demo does not forward reports to police.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Submit report</Button>
        </div>
      </form>
    </Modal>
  )
}

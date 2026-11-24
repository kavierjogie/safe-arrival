import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Ban, Hourglass, IdCard, Search, ShieldCheck, Star } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { PageHeader } from '../components/layout/Layouts'
import { Button, ConfirmDialog, DemoTag, EmptyState, Modal, Panel, inputCls, inputW } from '../components/common/ui'
import { CheckBadge, DriverStatusBadge } from '../components/common/StatusBadges'
import { initials } from '../components/driver/DriverCard'
import { DRIVER_STATUSES } from '../lib/journeyUtils'

const ACTIONS = {
  approve: { label: 'Approve driver', variant: 'safe', icon: ShieldCheck, patch: () => ({ verification_status: 'verified', permit_status: 'valid', id_check_status: 'passed', registration_check_status: 'passed', verified_at: new Date().toISOString() }), msg: 'All demo checks will be marked as passed and the driver becomes assignable to tourists.' },
  suspend: { label: 'Suspend driver', variant: 'danger', icon: Ban, patch: () => ({ verification_status: 'suspended', permit_status: 'suspended' }), msg: 'The driver will no longer be offered to tourists until re-approved.' },
  pending: { label: 'Mark verification pending', variant: 'outline', icon: Hourglass, patch: () => ({ verification_status: 'pending', permit_status: 'pending', registration_check_status: 'pending', verified_at: null }), msg: 'The driver is removed from assignment until checks are completed again.' },
}

function DriverDetail({ driver: d, onClose }) {
  const { updateDriver, journeys } = useDemo()
  const [action, setAction] = useState(null)
  const trips = journeys.filter((j) => j.driver_id === d.id)
  const steps = [
    ['Identity documentation', <CheckBadge key="a" value={d.id_check_status} />],
    ['Vehicle registration', <CheckBadge key="b" value={d.registration_check_status} />],
    ['Operating permit', <CheckBadge key="c" value={d.permit_status} />],
    ['Verification date', d.verified_at ? format(new Date(d.verified_at), 'd MMM yyyy') : 'Not verified'],
    ['Approved status', <DriverStatusBadge key="d" status={d.verification_status} />],
  ]
  return (
    <Modal open onClose={onClose} title={`Driver ${d.driver_reference}`} drawer>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-full bg-deep text-lg font-semibold text-white" aria-hidden>{initials(d.full_name)}</span>
          <div><p className="text-lg font-semibold">{d.full_name}</p><p className="flex items-center gap-1 text-sm text-muted"><Star className="size-3.5 fill-amber text-amber" aria-hidden />{d.rating} · {trips.length} demo trips</p></div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-muted">Vehicle</dt><dd className="font-medium">{d.vehicle_colour} {d.vehicle_make} {d.vehicle_model}</dd></div>
          <div><dt className="text-xs text-muted">Registration</dt><dd className="font-mono font-semibold">{d.registration_number}</dd></div>
        </dl>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Verification process</h3>
          <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {steps.map(([k, v], i) => <li key={k} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"><span><span className="mr-2 text-muted">{i + 1}.</span>{k}</span>{v}</li>)}
          </ol>
          <p className="mt-2 rounded-lg bg-amber/10 p-2.5 text-xs text-amber-ink">Prototype workflow: these statuses are simulated. No identity documents, licences or permits have actually been checked, and no documents are stored.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ACTIONS).map(([k, a]) => (
            <Button key={k} variant={a.variant} size="sm" onClick={() => setAction(k)}
              disabled={(k === 'approve' && d.verification_status === 'verified') || (k === 'suspend' && d.verification_status === 'suspended') || (k === 'pending' && d.verification_status === 'pending')}>
              <a.icon className="size-4" aria-hidden />{a.label}
            </Button>
          ))}
        </div>
      </div>
      <ConfirmDialog open={Boolean(action)} onClose={() => setAction(null)} title={action ? `${ACTIONS[action].label}?` : ''} message={action ? ACTIONS[action].msg : ''}
        confirmLabel={action ? ACTIONS[action].label : ''} variant={action ? ACTIONS[action].variant : 'primary'}
        onConfirm={() => { updateDriver(d.id, ACTIONS[action].patch()); toast.success(`${d.full_name}: ${ACTIONS[action].label.toLowerCase()} (simulated)`) }} />
    </Modal>
  )
}

export default function DriverManagementPage() {
  const { drivers } = useDemo()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const rows = drivers
    .filter((d) => status === 'all' || d.verification_status === status)
    .filter((d) => !q.trim() || [d.full_name, d.driver_reference, d.registration_number, d.vehicle_make, d.vehicle_model].some((v) => v.toLowerCase().includes(q.toLowerCase())))
  const selected = drivers.find((d) => d.id === selectedId)

  return (
    <>
      <PageHeader title="Driver verification" subtitle="Partner drivers who can be offered to arriving tourists. Only verified drivers are assigned."><DemoTag>Fictional profiles</DemoTag></PageHeader>
      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted" aria-hidden />
            <input aria-label="Search drivers" className={`${inputCls} pl-8`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, ID, registration…" /></div>
          <select aria-label="Verification status" className={`${inputW('w-auto')}`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>{Object.entries(DRIVER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {rows.length === 0 ? <EmptyState icon={IdCard} title="No drivers match" /> : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap min-w-[860px] text-sm">
              <thead className="text-left text-xs text-muted"><tr className="border-b border-slate-100">{['Driver ID', 'Name', 'Vehicle', 'Registration', 'Verification', 'Permit', 'Rating', 'Last verified'].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} onClick={() => setSelectedId(d.id)} className="cursor-pointer border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{d.driver_reference}</td>
                    <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); setSelectedId(d.id) }} className="font-medium hover:underline">{d.full_name}</button></td>
                    <td className="px-4 py-3">{d.vehicle_colour} {d.vehicle_make} {d.vehicle_model}</td>
                    <td className="px-4 py-3 font-mono">{d.registration_number}</td>
                    <td className="px-4 py-3"><DriverStatusBadge status={d.verification_status} /></td>
                    <td className="px-4 py-3"><CheckBadge value={d.permit_status} /></td>
                    <td className="px-4 py-3 tabular-nums">★ {d.rating}</td>
                    <td className="px-4 py-3 text-muted">{d.verified_at ? format(new Date(d.verified_at), 'd MMM yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {selected && <DriverDetail key={selected.id} driver={selected} onClose={() => setSelectedId(null)} />}
    </>
  )
}

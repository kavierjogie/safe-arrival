import { Car, Star } from 'lucide-react'
import { DriverStatusBadge } from '../common/StatusBadges'

export const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('')

/** Driver identity card. `code` is shown only to the tourist. */
export default function DriverCard({ driver, code, compact = false }) {
  if (!driver) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-navy">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-deep text-sm font-semibold text-white" aria-hidden>{initials(driver.full_name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{driver.full_name}</p>
          <p className="flex items-center gap-1 text-xs text-muted"><Star className="size-3 fill-amber text-amber" aria-hidden />{driver.rating} · {driver.driver_reference}</p>
        </div>
        <DriverStatusBadge status={driver.verification_status} />
      </div>
      <dl className={`mt-3 grid ${compact ? 'grid-cols-2' : 'grid-cols-2'} gap-2 text-sm`}>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-muted">Vehicle</dt>
          <dd className="flex items-center gap-1 font-medium"><Car className="size-3.5 text-muted" aria-hidden />{driver.vehicle_colour} {driver.vehicle_make} {driver.vehicle_model}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-muted">Registration</dt>
          <dd className="font-mono font-semibold tracking-wide">{driver.registration_number}</dd>
        </div>
      </dl>
      {code && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-navy px-3 py-2 text-white">
          <span className="text-xs text-white/80">Your verification code</span>
          <span className="font-mono text-xl font-bold tracking-[0.3em]">{code}</span>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">Demo driver — fictional profile used for demonstration.</p>
    </div>
  )
}

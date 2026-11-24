import {
  AlertOctagon, AlertTriangle, Ban, Car, CheckCircle2, CircleDot, Clock, Eye, Flag, Hourglass, MapPin, Navigation,
  ShieldAlert, ShieldCheck, ShieldQuestion, UserCheck, XCircle,
} from 'lucide-react'
import {
  DRIVER_STATUSES, INCIDENT_STATUSES, JOURNEY_STATUS, SAFETY_STATUS, SCAM_VERIFICATION, SEVERITIES,
} from '../../lib/journeyUtils'

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  teal: 'bg-teal/10 text-teal-ink ring-teal/25',
  green: 'bg-safe/10 text-safe-ink ring-safe/25',
  amber: 'bg-amber/15 text-amber-ink ring-amber/30',
  red: 'bg-alert/10 text-alert-ink ring-alert/25',
  navy: 'bg-deep/10 text-deep ring-deep/20',
}

// Every badge pairs colour with an icon + text so status never relies on colour alone.
export function Badge({ tone = 'slate', icon: Icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      {children}
    </span>
  )
}

const J = {
  awaiting_transport: ['slate', Hourglass], driver_assigned: ['navy', UserCheck], driver_confirmed: ['teal', ShieldCheck],
  picked_up: ['teal', Car], on_route: ['teal', Navigation], arrived: ['green', MapPin], safety_check_pending: ['amber', Clock],
  completed: ['green', CheckCircle2], incident_reported: ['red', AlertOctagon],
}
export const JourneyStatusBadge = ({ status }) => <Badge tone={J[status]?.[0]} icon={J[status]?.[1]}>{JOURNEY_STATUS[status] ?? status}</Badge>

const S = { pending: ['slate', CircleDot], on_track: ['green', ShieldCheck], check_pending: ['amber', Clock], safe: ['green', CheckCircle2], alert: ['amber', AlertTriangle], incident: ['red', ShieldAlert] }
export const SafetyBadge = ({ status }) => <Badge tone={S[status]?.[0]} icon={S[status]?.[1]}>{SAFETY_STATUS[status] ?? status}</Badge>

const SV = { critical: ['red', AlertOctagon], high: ['red', AlertTriangle], medium: ['amber', Flag], low: ['slate', Flag] }
export const SeverityBadge = ({ severity }) => <Badge tone={SV[severity]?.[0]} icon={SV[severity]?.[1]}>{SEVERITIES[severity] ?? severity}</Badge>

const IS = { new: ['red', CircleDot], acknowledged: ['amber', Eye], investigating: ['navy', Hourglass], resolved: ['green', CheckCircle2], closed: ['slate', CheckCircle2] }
export const IncidentStatusBadge = ({ status }) => <Badge tone={IS[status]?.[0]} icon={IS[status]?.[1]}>{INCIDENT_STATUSES[status] ?? status}</Badge>

const DS = { verified: ['green', ShieldCheck], pending: ['amber', ShieldQuestion], suspended: ['red', Ban], rejected: ['slate', XCircle] }
export const DriverStatusBadge = ({ status }) => <Badge tone={DS[status]?.[0]} icon={DS[status]?.[1]}>{DRIVER_STATUSES[status] ?? status}</Badge>

const SC = { unverified: ['slate', ShieldQuestion], under_review: ['amber', Eye], pattern_confirmed: ['navy', ShieldCheck] }
export const ScamVerificationBadge = ({ status }) => <Badge tone={SC[status]?.[0]} icon={SC[status]?.[1]}>{SCAM_VERIFICATION[status] ?? status}</Badge>

const CHECK = { passed: ['green', CheckCircle2, 'Passed (demo)'], valid: ['green', CheckCircle2, 'Valid (demo)'], pending: ['amber', Hourglass, 'Pending'], failed: ['red', XCircle, 'Failed (demo)'], expired: ['red', XCircle, 'Expired'], suspended: ['red', Ban, 'Suspended'] }
export const CheckBadge = ({ value }) => <Badge tone={CHECK[value]?.[0]} icon={CHECK[value]?.[1]}>{CHECK[value]?.[2] ?? value}</Badge>

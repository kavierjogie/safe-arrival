import { AREAS, AIRPORT } from './fareEstimator'

export const JOURNEY_STATUS = {
  awaiting_transport: 'Awaiting transport',
  driver_assigned: 'Driver assigned',
  driver_confirmed: 'Driver confirmed',
  picked_up: 'Picked up',
  on_route: 'On route',
  arrived: 'Arrived',
  safety_check_pending: 'Safety check pending',
  completed: 'Completed',
  incident_reported: 'Incident reported',
}

export const SAFETY_STATUS = {
  pending: 'Not started',
  on_track: 'On track',
  check_pending: 'Arrival check pending',
  safe: 'Safe arrival confirmed',
  alert: 'Needs attention',
  incident: 'Incident reported',
}

export const ACTIVE_STATUSES = ['awaiting_transport', 'driver_assigned', 'driver_confirmed', 'picked_up', 'on_route', 'arrived', 'safety_check_pending']
export const isActive = (j) => ACTIVE_STATUSES.includes(j.journey_status)

export const INCIDENT_CATEGORIES = {
  driver_impersonation: 'Driver impersonation',
  vehicle_mismatch: 'Vehicle mismatch',
  overcharging: 'Overcharging',
  unsafe_route: 'Unsafe route',
  harassment: 'Harassment',
  lost_tourist: 'Lost tourist',
  driver_not_found: 'Unable to find driver',
  theft: 'Theft',
  other: 'Other',
}
export const INCIDENT_STATUSES = { new: 'New', acknowledged: 'Acknowledged', investigating: 'Investigating', resolved: 'Resolved', closed: 'Closed' }
export const SEVERITIES = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }
export const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 }
export const DEFAULT_SEVERITY = {
  driver_impersonation: 'critical', harassment: 'critical', vehicle_mismatch: 'high', unsafe_route: 'high',
  theft: 'high', overcharging: 'medium', lost_tourist: 'medium', driver_not_found: 'medium', other: 'medium',
}

export const DRIVER_STATUSES = { verified: 'Verified', pending: 'Pending', suspended: 'Suspended', rejected: 'Rejected' }

export const SCAM_CATEGORIES = {
  airport_overcharging: 'Airport transport overcharging',
  fake_ridehailing: 'Fake ride-hailing drivers',
  fake_tour_operator: 'Fake tour operators',
  accommodation_scam: 'Accommodation scams',
  atm_scam: 'ATM scams',
  card_fraud: 'Card fraud',
  fake_guide: 'Fake guides',
  taxi_impersonation: 'Taxi impersonation',
  distraction_theft: 'Tourist distraction theft',
}
export const SCAM_VERIFICATION = { unverified: 'Unverified', under_review: 'Under review', pattern_confirmed: 'Pattern confirmed (demo)' }

// Tracking stages shown to tourists / hotels / public link.
export const STAGES = [
  { key: 'driver_confirmed', label: 'Driver confirmed' },
  { key: 'picked_up', label: 'Pickup completed' },
  { key: 'on_route', label: 'On route' },
  { key: 'arrived', label: 'Arrived' },
]
export function stageIndex(status) {
  return { driver_confirmed: 0, picked_up: 1, on_route: 2, arrived: 3, safety_check_pending: 3, completed: 3 }[status] ?? -1
}

export function etaMinutes(j) {
  if (['arrived', 'safety_check_pending', 'completed'].includes(j.journey_status)) return 0
  if (!j.estimated_arrival) return null
  return Math.round((new Date(j.estimated_arrival) - Date.now()) / 60000)
}
export function formatEta(j) {
  if (j.journey_status === 'incident_reported') return '—'
  const m = etaMinutes(j)
  if (m === null) return '—'
  if (['arrived', 'safety_check_pending', 'completed'].includes(j.journey_status)) return 'Arrived'
  if (m < -1) return j.journey_status === 'on_route' ? 'Overdue' : '—'
  return `${Math.max(1, m)} min`
}

export const routeFor = (j) => (AREAS[j.destination_area] ?? AREAS.cbd).path.concat(
  j.destination_lat ? [[j.destination_lat, j.destination_lng]] : [],
)

/** Point at fraction t (0–1) along a polyline, by segment length. */
export function pointAlong(path, t) {
  if (t <= 0) return path[0]
  const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
  let d = seg.reduce((a, b) => a + b, 0) * Math.min(t, 1)
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const f = seg[i] ? d / seg[i] : 0
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f]
    }
    d -= seg[i]
  }
  return path[path.length - 1]
}

export const vehiclePosition = (j) => pointAlong(routeFor(j), j.route_progress ?? 0)
export { AIRPORT }

// --- References -------------------------------------------------------------
export function nextJourneyReference(journeys) {
  const max = journeys.reduce((m, j) => Math.max(m, Number(j.journey_reference?.split('-')[2]) || 0), 400)
  return `CPT-2026-${String(max + 1).padStart(5, '0')}`
}
export function newCaseReference(incidents) {
  const used = new Set(incidents.map((i) => i.case_reference))
  let ref
  do ref = `CPT-${Math.floor(1000 + Math.random() * 9000)}`
  while (used.has(ref))
  return ref
}
export const newVerificationCode = () => String(Math.floor(1000 + Math.random() * 9000))
export const newShareToken = () => 'trk_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
export const uuid = () => crypto.randomUUID()

// --- Derived operational alerts --------------------------------------------
export const ALERT_TYPES = {
  driver_mismatch: 'Driver verification mismatch',
  vehicle_mismatch: 'Vehicle registration mismatch',
  overdue: 'Journey overdue',
  incident: 'Incident reported',
  no_confirmation: 'Tourist did not confirm arrival',
  deviation: 'Unexpected destination deviation (simulated)',
}

export function deriveAlerts({ journeys, incidents }) {
  const now = Date.now()
  const alerts = []
  for (const i of incidents) {
    if (['resolved', 'closed'].includes(i.incident_status)) continue
    const type = i.category === 'driver_impersonation' ? 'driver_mismatch' : i.category === 'vehicle_mismatch' ? 'vehicle_mismatch' : 'incident'
    alerts.push({ id: `inc-${i.id}`, type, severity: i.severity, journey_id: i.journey_id, incident_id: i.id, at: i.created_at, detail: `${i.case_reference} · ${INCIDENT_CATEGORIES[i.category]}` })
  }
  for (const j of journeys) {
    if (j.journey_status === 'on_route' && j.estimated_arrival && now - new Date(j.estimated_arrival) > 10 * 60000)
      alerts.push({ id: `od-${j.id}`, type: 'overdue', severity: 'high', journey_id: j.id, at: j.estimated_arrival, detail: `${j.journey_reference} · expected ${Math.round((now - new Date(j.estimated_arrival)) / 60000)} min ago` })
    if (j.journey_status === 'safety_check_pending' && j.updated_at && now - new Date(j.updated_at) > 15 * 60000)
      alerts.push({ id: `nc-${j.id}`, type: 'no_confirmation', severity: 'medium', journey_id: j.id, at: j.updated_at, detail: `${j.journey_reference} · ${j.tourist_name}` })
    if (j.safety_status === 'alert' && isActive(j))
      alerts.push({ id: `dv-${j.id}`, type: 'deviation', severity: 'high', journey_id: j.id, at: j.updated_at, detail: `${j.journey_reference} · ${j.destination}` })
  }
  return alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || new Date(b.at) - new Date(a.at))
}

export const guestRef = (j) => j.tourist_name || `Guest ${j.journey_reference?.slice(-3)}`

/** Active, or stopped by an incident — still needs eyes on it. */
export const needsMonitoring = (j) => isActive(j) || j.journey_status === 'incident_reported'

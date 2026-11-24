import { JOURNEY_IDS as J } from './demoJourneys.js'

// Sample incidents — fictional, not real reports or police statistics.
const id = (n) => `44444444-4444-4444-8444-00000000000${n}`

export function demoIncidents(ago) {
  const i = (n, case_reference, journey_id, category, severity, incident_status, minsAgo, description, o = {}) => ({
    id: id(n), case_reference, journey_id, category, severity, incident_status, description,
    hotel_notified: false, tourist_reference: o.tourist ?? 'Anonymous visitor', resolution: o.resolution ?? null,
    created_at: ago(minsAgo), updated_at: ago(o.updated ?? Math.max(1, minsAgo - 10)),
    resolved_at: ['resolved', 'closed'].includes(incident_status) ? ago(Math.max(1, minsAgo - 60)) : null,
  })
  return [
    i(1, 'CPT-3107', J.chloe, 'overcharging', 'medium', 'investigating', 70, 'Driver asked for R650 cash on arrival in Sea Point — far above the estimate shown. Tourist paid R400 and left the vehicle.', { tourist: 'Chloé D.' }),
    i(2, 'CPT-2984', null, 'driver_impersonation', 'critical', 'acknowledged', 95, 'Person in the arrivals hall claimed to be a ride-hailing partner and asked the tourist to follow them to a private car. Tourist declined and reported it.'),
    i(3, 'CPT-2755', J.james, 'unsafe_route', 'high', 'new', 2, 'Simulated deviation alert: vehicle left the expected route towards Stellenbosch. Awaiting check-in with tourist.', { tourist: 'James K.', updated: 2 }),
    i(4, 'CPT-2876', null, 'vehicle_mismatch', 'high', 'resolved', 26 * 60, 'Registration plate did not match booking details. Tourist did not enter the vehicle and rebooked.', { resolution: 'Tourist rebooked with a verified driver. Unverified vehicle reported to operator.' }),
    i(5, 'CPT-2690', null, 'harassment', 'critical', 'closed', 3 * 1440, 'Tourist reported verbal harassment during the trip. Driver account suspended pending review.', { resolution: 'Driver CPT-DRV-007 suspended. Tourist offered follow-up support.' }),
    i(6, 'CPT-2611', null, 'lost_tourist', 'medium', 'resolved', 4 * 1440, 'Tourist could not find the pickup point after leaving arrivals.', { resolution: 'Guided to the designated pickup area via chat.' }),
    i(7, 'CPT-2540', null, 'theft', 'high', 'closed', 6 * 1440, 'Phone snatched through an open car window at a traffic light near the CBD.', { resolution: 'Tourist referred to SAPS to open a case. Safety tip added to insights.' }),
    i(8, 'CPT-2477', null, 'overcharging', 'low', 'resolved', 9 * 1440, 'Driver added an unexplained "airport fee" of R80.', { resolution: 'Fare difference refunded by operator after review.' }),
    i(9, 'CPT-2399', null, 'driver_not_found', 'medium', 'closed', 12 * 1440, 'Booked driver could not be located at arrivals for 25 minutes.', { resolution: 'Driver was waiting at the wrong terminal exit. Pickup instructions improved.' }),
  ]
}

export function demoIncidentNotes(ago) {
  const n = (k, incident, note, minsAgo) => ({ id: `45454545-4545-4545-8545-00000000000${k}`, incident_id: id(incident), author_id: null, note, created_at: ago(minsAgo) })
  return [
    n(1, 1, 'Contacted tourist via chat. Requested receipt photo.', 60),
    n(2, 2, 'Pattern matches two earlier reports this month — flagged to airport liaison (demo).', 85),
    n(3, 5, 'Driver suspended. Case closed after review.', 3 * 1440 - 120),
  ]
}

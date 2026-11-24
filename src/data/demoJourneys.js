import { AREAS, DESTINATIONS, estimateFare } from '../lib/fareEstimator.js'
import { DRIVER_IDS as D } from './demoDrivers.js'

// Fictional guests. Journey references stop at 00420 so the live demo
// journey becomes CPT-2026-00421.
const id = (n) => `33333333-3333-4333-8333-0000000000${String(n).padStart(2, '0')}`
export const JOURNEY_IDS = { emma: id(1), lukas: id(2), aiko: id(3), daniel: id(4), priya: id(5), marco: id(6), chloe: id(7), james: id(8), fatima: id(9), noah: id(10) }

const dest = (key) => DESTINATIONS.find((d) => d.id === key)
const custom = (name, area) => ({ name, area, lat: AREAS[area].lat, lng: AREAS[area].lng, hotelId: null })

export function demoJourneys(ago) {
  const mk = (n, ref, tourist_name, d, o) => {
    const fare = estimateFare(d)
    return {
      id: id(n), journey_reference: `CPT-2026-00${ref}`, tourist_name, tourist_phone: null,
      hotel_id: d.hotelId, destination: d.name, destination_area: d.area, destination_lat: d.lat, destination_lng: d.lng,
      driver_id: null, verification_code: String(4000 + n * 137), estimated_fare: fare.estimate, fare_min: fare.min, fare_max: fare.max,
      fare_currency: 'ZAR', estimated_distance_km: fare.km, estimated_duration_min: fare.midMinutes,
      estimated_arrival: null, actual_arrival: null, journey_status: 'awaiting_transport', safety_status: 'pending',
      share_token: `trk_demo${tourist_name.toLowerCase().replace(/[^a-z]/g, '')}${n}`, share_enabled: true, share_target: d.hotelId ? 'hotel' : 'contact',
      pickup_location: 'Cape Town International Airport — Arrivals', route_progress: 0,
      started_at: null, completed_at: null, created_at: ago(o.created), updated_at: ago(o.updated ?? 2),
      ...o.row,
    }
  }
  return [
    mk(1, 412, 'Emma W.', dest('radisson'), { created: 38, updated: 1, row: { driver_id: D.lindiwe, journey_status: 'on_route', safety_status: 'on_track', route_progress: 0.6, started_at: ago(16), estimated_arrival: ago(-9) } }),
    mk(2, 420, 'Lukas B.', dest('silo'), { created: 3, updated: 3, row: { estimated_arrival: null } }),
    mk(3, 418, 'Aiko T.', dest('sky'), { created: 9, updated: 5, row: { driver_id: D.pieter, journey_status: 'driver_assigned', safety_status: 'on_track', estimated_arrival: ago(-31) } }),
    mk(4, 416, 'Daniel O.', dest('marriott'), { created: 18, updated: 4, row: { driver_id: D.sipho, journey_status: 'picked_up', safety_status: 'on_track', route_progress: 0.05, started_at: ago(4), estimated_arrival: ago(-23) } }),
    mk(5, 405, 'Priya N.', dest('rockefeller'), { created: 190, updated: 140, row: { driver_id: D.ayesha, journey_status: 'completed', safety_status: 'safe', route_progress: 1, started_at: ago(168), actual_arrival: ago(141), completed_at: ago(140), estimated_arrival: ago(142) } }),
    mk(6, 409, 'Marco R.', custom('Camps Bay guesthouse (Victoria Rd)', 'camps_bay'), { created: 80, updated: 24, row: { driver_id: D.thabo, journey_status: 'safety_check_pending', safety_status: 'check_pending', route_progress: 1, started_at: ago(60), estimated_arrival: ago(25) } }),
    mk(7, 407, 'Chloé D.', custom('Sea Point apartment (Beach Rd)', 'sea_point'), { created: 120, updated: 70, row: { driver_id: null, journey_status: 'incident_reported', safety_status: 'incident', route_progress: 1, started_at: ago(100), estimated_arrival: ago(72), verification_code: null } }),
    mk(8, 414, 'James K.', custom('Stellenbosch guest farm', 'stellenbosch'), { created: 34, updated: 2, row: { driver_id: D.kagiso, journey_status: 'on_route', safety_status: 'alert', route_progress: 0.45, started_at: ago(22), estimated_arrival: ago(-24) } }),
    mk(9, 401, 'Fatima A.', dest('rockefeller'), { created: 300, updated: 255, row: { driver_id: D.lindiwe, journey_status: 'completed', safety_status: 'safe', route_progress: 1, started_at: ago(285), actual_arrival: ago(256), completed_at: ago(255), estimated_arrival: ago(258) } }),
    mk(10, 410, 'Noah S.', dest('sky'), { created: 75, updated: 20, row: { driver_id: D.ayesha, journey_status: 'on_route', safety_status: 'on_track', route_progress: 0.85, started_at: ago(50), estimated_arrival: ago(14) } }),
  ]
}

export function demoJourneyUpdates(journeys) {
  const rows = []
  const add = (j, status, description, at) => rows.push({ id: crypto.randomUUID(), journey_id: j.id, status, latitude: null, longitude: null, description, created_at: at })
  for (const j of journeys) {
    add(j, 'awaiting_transport', `Journey created to ${j.destination}`, j.created_at)
    if (j.driver_id) add(j, 'driver_assigned', 'Verified demo driver assigned', j.created_at)
    if (j.started_at) add(j, 'picked_up', 'Pickup completed at airport arrivals', j.started_at)
    if (['on_route', 'safety_check_pending', 'completed'].includes(j.journey_status)) add(j, 'on_route', 'Vehicle on route (simulated)', j.started_at)
    if (j.safety_status === 'alert') add(j, 'on_route', 'Simulated route deviation flagged for review', j.updated_at)
    if (j.journey_status === 'safety_check_pending') add(j, 'safety_check_pending', 'Vehicle at destination — awaiting tourist confirmation', j.updated_at)
    if (j.journey_status === 'completed') add(j, 'completed', 'Tourist confirmed safe arrival', j.completed_at)
    if (j.journey_status === 'incident_reported') add(j, 'incident_reported', 'Tourist reported a problem', j.updated_at)
  }
  return rows
}

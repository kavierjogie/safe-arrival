import { DESTINATIONS } from '../lib/fareEstimator.js'
import { demoDrivers } from './demoDrivers.js'
import { demoJourneys, demoJourneyUpdates, JOURNEY_IDS as J } from './demoJourneys.js'
import { demoIncidents, demoIncidentNotes } from './demoIncidents.js'

// Hotel names are real Cape Town properties used for DEMONSTRATION ONLY.
// Contact details are fictional (.example domains). No partnership implied.
const HOTEL_INFO = {
  rockefeller: ['33 Chiappini St, De Waterkant', 'frontdesk@rockefeller.example', '+27 21 000 0001'],
  marriott: ['Century Blvd, Century City', 'concierge@crystaltowers.example', '+27 21 000 0002'],
  radisson: ['Silo District, V&A Waterfront', 'reception@radissonred.example', '+27 21 000 0003'],
  sky: ['Riebeek St, Cape Town CBD', 'frontdesk@hotelsky.example', '+27 21 000 0004'],
  silo: ['Silo Square, V&A Waterfront', 'guests@silohotel.example', '+27 21 000 0005'],
}

export function demoHotels(ago) {
  return DESTINATIONS.filter((d) => d.hotelId).map((d) => ({
    id: d.hotelId, name: d.name, address: HOTEL_INFO[d.id][0], contact_email: HOTEL_INFO[d.id][1],
    contact_phone: HOTEL_INFO[d.id][2], created_at: ago(300 * 1440),
  }))
}

// Sample, anonymised scam reports — NOT real-world or police data.
export function demoScamReports(ago) {
  const s = (n, category, location, description, severity, verification_status, daysAgo) => ({
    id: `55555555-5555-4555-8555-0000000000${String(n).padStart(2, '0')}`, category, location, description,
    severity, verification_status, anonymous: true, created_at: ago(daysAgo * 1440),
  })
  return [
    s(1, 'fake_ridehailing', 'CPT Airport — arrivals hall', 'Man approached at arrivals saying he was "the Uber driver" without naming me or showing the app booking.', 'high', 'pattern_confirmed', 1),
    s(2, 'airport_overcharging', 'CPT Airport — pickup area', 'Unmarked car quoted R900 to the CBD.', 'medium', 'under_review', 2),
    s(3, 'taxi_impersonation', 'CPT Airport — arrivals hall', 'Person with a lanyard claimed to be official airport transport and asked for cash upfront.', 'high', 'pattern_confirmed', 4),
    s(4, 'atm_scam', 'Long Street, CBD', 'Stranger offered to "help" at the ATM and tried to see my PIN.', 'high', 'under_review', 6),
    s(5, 'fake_guide', 'Table Mountain lower cableway', 'Unofficial guide sold "skip the queue" tickets that were not valid.', 'medium', 'unverified', 8),
    s(6, 'distraction_theft', 'Greenmarket Square', 'Someone spilled a drink on me while another person reached for my bag.', 'medium', 'pattern_confirmed', 10),
    s(7, 'fake_ridehailing', 'CPT Airport — pickup area', 'Driver called my name but the registration did not match the app.', 'high', 'pattern_confirmed', 12),
    s(8, 'accommodation_scam', 'Sea Point', 'Listing asked for a deposit by bank transfer outside the booking platform.', 'high', 'under_review', 15),
    s(9, 'card_fraud', 'V&A Waterfront', 'Card skimmed at a portable card machine at a market stall.', 'medium', 'unverified', 18),
    s(10, 'airport_overcharging', 'CPT Airport — arrivals hall', 'Driver refused to use the app and demanded a fixed cash price.', 'medium', 'pattern_confirmed', 21),
    s(11, 'fake_tour_operator', 'Bo-Kaap', 'Paid a deposit online for a tour that never showed up.', 'medium', 'under_review', 25),
    s(12, 'distraction_theft', 'Camps Bay', 'Phone taken from the table while someone asked for directions.', 'low', 'unverified', 30),
    s(13, 'taxi_impersonation', 'Cape Town Station', 'Unmarked car with a removable "taxi" sign charged triple the meter rate.', 'medium', 'unverified', 36),
    s(14, 'fake_ridehailing', 'V&A Waterfront', 'Car pulled up claiming to be my ride before the app showed the driver had arrived.', 'high', 'under_review', 42),
    s(15, 'atm_scam', 'Century City', 'Card got "stuck"; a bystander offered help and asked me to re-enter the PIN.', 'high', 'pattern_confirmed', 50),
  ]
}

export function demoNotifications(ago) {
  const H = Object.fromEntries(DESTINATIONS.filter((d) => d.hotelId).map((d) => [d.id, d.hotelId]))
  const n = (k, recipient_type, recipient_id, title, message, notification_type, minsAgo, read = false) => ({
    id: `66666666-6666-4666-8666-0000000000${String(k).padStart(2, '0')}`, recipient_type, recipient_id, title, message,
    notification_type, read_at: read ? ago(minsAgo - 1) : null, created_at: ago(minsAgo), journey_id: null,
  })
  return [
    { ...n(1, 'hotel', H.radisson, 'Guest on the way', 'Emma W. is on route — ETA about 9 min.', 'journey_started', 16), journey_id: J.emma },
    { ...n(2, 'hotel', H.silo, 'Journey shared', 'Lukas B. shared their journey from the airport.', 'journey_shared', 3), journey_id: J.lukas },
    { ...n(3, 'hotel', H.sky, 'Driver assigned', 'Aiko T. has a verified demo driver assigned.', 'driver_assigned', 5), journey_id: J.aiko },
    { ...n(4, 'hotel', H.marriott, 'Guest picked up', 'Daniel O. has been picked up at arrivals.', 'journey_started', 4), journey_id: J.daniel },
    { ...n(5, 'hotel', H.rockefeller, 'Safe arrival confirmed', 'Priya N. confirmed safe arrival.', 'arrival_confirmed', 140, true), journey_id: J.priya },
    { ...n(6, 'hotel', H.sky, 'ETA changed', 'Noah S. is running late — check journey.', 'eta_changed', 20), journey_id: J.noah },
    { ...n(7, 'operations', null, 'Incident reported', 'CPT-3107 · Overcharging reported on CPT-2026-00407.', 'incident_reported', 70), journey_id: J.chloe },
    { ...n(8, 'operations', null, 'Deviation alert (simulated)', 'CPT-2026-00414 left the expected route.', 'safety_alert', 2), journey_id: J.james },
    { ...n(9, 'operations', null, 'Arrival not confirmed', 'Marco R. has not confirmed arrival.', 'safety_alert', 9), journey_id: J.marco },
    { ...n(10, 'hotel', H.rockefeller, 'Safe arrival confirmed', 'Fatima A. confirmed safe arrival.', 'arrival_confirmed', 255, true), journey_id: J.fatima },
  ]
}

/** Full seed state, with timestamps relative to `now`. */
export function buildSeed(now = Date.now()) {
  const ago = (mins) => new Date(now - mins * 60000).toISOString()
  const journeys = demoJourneys(ago)
  return {
    hotels: demoHotels(ago),
    drivers: demoDrivers(ago),
    journeys,
    journey_updates: demoJourneyUpdates(journeys),
    incidents: demoIncidents(ago),
    incident_notes: demoIncidentNotes(ago),
    scam_reports: demoScamReports(ago),
    notifications: demoNotifications(ago),
  }
}

export const TABLES = ['hotels', 'drivers', 'journeys', 'journey_updates', 'incidents', 'incident_notes', 'scam_reports', 'notifications']

// Anonymised, sample-based guidance (not official statistics).
export const SAFETY_INSIGHTS = [
  'Multiple reports of drivers claiming to be ride-hailing partners without matching booking details.',
  'Visitors have reported confusion around airport pickup points.',
  'Always compare your vehicle registration with the booking details before entering.',
  'Several reports describe strangers offering "help" at ATMs — decline and use machines inside malls or banks.',
]
export const SAFETY_TIPS = [
  'Only accept rides you booked yourself — never from someone who approaches you in arrivals.',
  'Match the registration, car model and colour before you get in.',
  'Ask your driver to tell you your verification code — never read it out to them.',
  'Share your journey with your accommodation or someone you trust.',
  'Agree on the fare or check the estimate before departure.',
  'Keep phones and bags away from open windows in traffic.',
]

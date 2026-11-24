import { useCallback } from 'react'
import { useDemo } from '../context/DemoContext'
import { estimateFare, rand, resolveDestination } from '../lib/fareEstimator'
import { DEFAULT_SEVERITY, uuid } from '../lib/journeyUtils'

const now = () => new Date().toISOString()
const msg = (from, text, kind = 'text', data = null) => ({ id: uuid(), from, text, kind, data, at: now() })

export const TOURIST_INCIDENT_OPTIONS = [
  ['Driver or vehicle mismatch', 'vehicle_mismatch'],
  ['Overcharging', 'overcharging'],
  ['Unsafe route', 'unsafe_route'],
  ['Harassment', 'harassment'],
  ['Unable to find driver', 'driver_not_found'],
  ['Other', 'other'],
]

const WELCOME = `Welcome to Cape Town! 👋

I'm Cape Town Safe Arrival, your travel safety assistant.

I can help you check transport information, verify your driver, share your journey with your accommodation, and get help if something doesn't feel right.

Where are you heading today?`

/**
 * The scripted WhatsApp conversation. Chat state lives in DemoContext so it
 * survives navigation and is cleared by Reset Demo.
 */
export function useTouristChat({ onEmergency, onReportScam } = {}) {
  const demo = useDemo()
  const { chat, setChat, schedule, journeys } = demo
  const journey = journeys.find((j) => j.id === chat.journeyId) ?? null

  const push = useCallback((m) => setChat((c) => ({ ...c, messages: [...c.messages, m] })), [setChat])

  /** Bot replies one by one with a typing indicator, then moves to `step`. */
  const say = useCallback((items, step) => {
    setChat({ typing: true })
    let delay = 0
    items.forEach((it, i) => {
      const m = typeof it === 'string' ? msg('bot', it) : msg('bot', it.text ?? '', it.kind, it.data)
      delay += Math.min(1300, 550 + (m.text.length || 120) * 4)
      schedule(() => {
        setChat((c) => ({ ...c, messages: [...c.messages, m], ...(i === items.length - 1 ? { typing: false, step: step ?? c.step } : {}) }))
      }, delay)
    })
  }, [setChat, schedule])

  const user = useCallback((text) => push({ ...msg('user', text), status: 'read' }), [push])

  // ---- Flow actions --------------------------------------------------------
  const start = useCallback((touristName) => {
    setChat({ started: true, touristName, messages: [], step: 'busy' })
    say([WELCOME], 'menu')
  }, [setChat, say])

  const askDestination = () => say(["Where are you staying in Cape Town?", 'Pick a suggestion below or type your hotel, guesthouse or address.'], 'destination')

  const chooseDestination = (text) => {
    if (!text.trim()) return
    user(text)
    const dest = resolveDestination(text)
    const fare = estimateFare(dest)
    const j = demo.createJourney({ touristName: chat.touristName, destination: dest, fare })
    setChat({ journeyId: j.id, step: 'busy' })
    say([
      `Your destination is ${dest.name}.\n\nEstimated transport fare: ${rand(fare.estimate)}.\n\nWe recommend confirming your final fare with your transport provider before departure.`,
      { kind: 'fare', data: { fare, destination: dest.name, custom: dest.custom } },
      'Would you like to request a verified Safe Arrival driver for this demo?',
    ], 'fare')
  }

  const requestDriver = () => {
    user('Request verified driver')
    const res = demo.assignDriver(chat.journeyId)
    if (!res) return say(['Sorry — no verified demo drivers are available right now. Try again after an operator approves a driver.'], 'fare')
    const { driver: d, code } = res
    say([
      'Finding a verified demo driver near arrivals…',
      `Your demo driver has been assigned.\n\nDriver: ${d.full_name}\nVehicle: ${d.vehicle_colour} ${d.vehicle_make} ${d.vehicle_model}\nRegistration: ${d.registration_number}\nDriver verification code: ${code}\n\nBefore entering the vehicle:\n1. Confirm the registration matches.\n2. Confirm the vehicle matches.\n3. Ask the driver to tell you your verification code.\n4. Do not enter if any details differ.`,
      { kind: 'driver', data: { driverId: d.id, code } },
    ], 'driver')
  }

  const useRideHailing = () => {
    user('Use Uber/Bolt')
    say([
      'Good choice — here is how to stay safe with a ride-hailing app:\n\n• Book only inside the official app, never with someone who approaches you.\n• Follow airport signage to the designated e-hailing pickup area.\n• Match the driver name, photo, car and registration to the app before getting in.\n• Use the app\'s own trip-sharing feature.\n\nSafe Arrival can\'t see Uber or Bolt bookings in this demo.',
    ], 'fare_alt')
  }

  const confirmDriver = () => {
    user('Confirm driver details')
    demo.updateJourney(chat.journeyId, { journey_status: 'driver_assigned', safety_status: 'on_track' }, { log: 'Tourist confirmed driver details in chat' })
    say(['Thanks — driver details saved to your journey. Remember: check the code with your driver at the pickup point before getting in.', 'Would you like to share your trip with your accommodation?'], 'share')
  }

  const share = (target) => {
    user(target === 'hotel' ? 'Share with hotel' : 'Share with trusted contact')
    const isPartner = target === 'hotel' && journey?.hotel_id
    demo.shareJourney(chat.journeyId, isPartner ? 'hotel' : 'contact')
    const followUp = 'Next: meet your driver at the pickup point. Use the demo controls to simulate each stage of the trip.'
    if (isPartner) {
      say([`Your journey has been shared with your accommodation.\n\nYour hotel has been notified that you're on your way.\n\nJourney reference: ${journey.journey_reference}`, { kind: 'share', data: { target: 'hotel' } }, followUp], 'trip')
    } else if (target === 'hotel') {
      say([`${journey?.destination} isn't a partner property in this demo, so we couldn't notify it directly. Here's a private tracking link you can send them yourself.`, { kind: 'share', data: { target: 'contact' } }, followUp], 'trip')
    } else {
      say(['Here is your private tracking link. Send it to someone you trust — it shows your journey status and ETA, never your phone number or verification code.', { kind: 'share', data: { target: 'contact' } }, followUp], 'trip')
    }
  }

  const skipShare = () => {
    user('Skip')
    say(['No problem — your journey stays private. You can still copy a tracking link from the journey panel later.', 'Next: meet your driver at the pickup point. Use the demo controls to simulate each stage of the trip.'], 'trip')
  }

  // ---- Simulated trip stages (also used by presenter controls) ------------
  const advanceTrip = useCallback(() => {
    if (!journey) return
    const id = journey.id
    const s = journey.journey_status
    if (s === 'driver_assigned' || s === 'awaiting_transport') {
      user('▶ Simulate: Driver confirmed')
      demo.updateJourney(id, { journey_status: 'driver_confirmed' }, { log: 'Driver met tourist at pickup — code checked (simulated)' })
      say(['Driver confirmed at pickup ✅ (simulated)\n\nYou checked the registration, the vehicle, and your verification code with the driver.'])
    } else if (s === 'driver_confirmed') {
      user('▶ Simulate: Pickup completed')
      demo.updateJourney(id, { journey_status: 'picked_up', started_at: now(), route_progress: 0.05 }, {
        log: 'Pickup completed at airport arrivals',
        hotelNote: { title: 'Guest picked up', message: `${journey.tourist_name || 'Your guest'} has been picked up at the airport.`, notification_type: 'journey_started' },
      })
      say(['Pickup completed. Your journey has started — have a good trip! 🚗'])
    } else if (s === 'picked_up') {
      user('▶ Simulate: On route')
      const eta = new Date(Date.now() + journey.estimated_duration_min * 60000).toISOString()
      demo.updateJourney(id, { journey_status: 'on_route', route_progress: 0.12, estimated_arrival: eta }, {
        log: 'Vehicle on route (simulated location)',
        hotelNote: { title: 'Guest on the way', message: `${journey.tourist_name || 'Your guest'} is on route — ETA about ${Math.round(journey.estimated_duration_min)} min.`, notification_type: 'eta_changed' },
      })
      say([`You're on route to ${journey.destination}. Estimated arrival in about ${Math.round(journey.estimated_duration_min)} minutes (simulated).`])
    } else if (s === 'on_route') {
      user('▶ Simulate: Arrived')
      demo.updateJourney(id, { journey_status: 'safety_check_pending', safety_status: 'check_pending', route_progress: 1, actual_arrival: now() }, { log: 'Vehicle arrived at destination — awaiting tourist confirmation' })
      say(['Have you arrived safely at your accommodation?'], 'arrival')
    }
  }, [journey, demo, user, say])

  const confirmArrival = () => {
    user('Yes, I arrived safely')
    demo.updateJourney(chat.journeyId, { journey_status: 'completed', safety_status: 'safe', completed_at: now() }, {
      log: 'Tourist confirmed safe arrival',
      hotelNote: { title: 'Safe arrival confirmed', message: `${journey?.tourist_name || 'Your guest'} confirmed they arrived safely.`, notification_type: 'arrival_confirmed' },
    })
    say([
      "That's great to hear! 🎉\n\nWe've marked your journey as completed.\n\n" + (journey?.share_enabled && journey?.hotel_id ? 'Your accommodation has been notified of your safe arrival.\n\n' : '') + 'Thank you for using Cape Town Safe Arrival.\n\nEnjoy your stay in Cape Town!',
      { kind: 'arrival' },
      'How was your Safe Arrival experience?',
    ], 'done')
  }

  const startIncident = (label, category = null, preface = null) => {
    user(label)
    const inc = demo.createIncident({ journeyId: chat.journeyId, category: category ?? 'other', touristReference: chat.touristName })
    setChat({ incidentId: inc.id, step: 'busy' })
    say([
      ...(preface ? [preface] : []),
      `I'm sorry you're experiencing a problem.\n\nYour safety is important.\n\nWe've created a safety support report for this demo.\n\nYour case reference is:\n\n${inc.case_reference}\n\nIf you are in immediate danger, contact local emergency services immediately.`,
      { kind: 'disclaimer' },
      category ? 'Please describe what happened (optional). Type below, or skip.' : 'Would you like to tell us what happened?',
    ], category ? 'incident_details' : 'incident_category')
  }

  const chooseCategory = (label, category) => {
    user(label)
    demo.updateIncident(chat.incidentId, { category, severity: DEFAULT_SEVERITY[category] })
    say(['Thank you. Please describe what happened in a few words (optional). Type below, or skip.'], 'incident_details')
  }

  const finishIncident = (text) => {
    if (text) {
      user(text)
      demo.updateIncident(chat.incidentId, { description: text.trim().slice(0, 1000) })
    } else user('Skip description')
    const inc = demo.incidents.find((i) => i.id === chat.incidentId)
    say([
      `Thank you — your report ${inc?.case_reference ?? ''} is now visible to the Safe Arrival operations team in this demo.${inc?.hotel_notified ? ' Your accommodation has also been alerted.' : ''}\n\nPlease stay in a safe, public place.`,
      { kind: 'emergency' },
    ], 'incident_done')
  }

  // ---- Quick replies for the current step ---------------------------------
  const tips = () => { user('View safety tips'); say([{ kind: 'tips' }]) }
  const checklist = () => { user('Show safety checklist'); say([{ kind: 'checklist' }]) }
  const emergency = () => { user('Emergency assistance'); onEmergency?.(); say([{ kind: 'emergency' }]) }
  const scam = () => { user('Report a scam'); onReportScam?.() }
  const feedback = (label) => { user(label); say(['Thanks for the feedback — it helps us improve the service. Stay safe and enjoy Cape Town! 🌊'], 'finished') }

  const nextTripLabel = {
    awaiting_transport: '▶ Simulate: Driver confirmed', driver_assigned: '▶ Simulate: Driver confirmed',
    driver_confirmed: '▶ Simulate: Pickup completed', picked_up: '▶ Simulate: On route', on_route: '▶ Simulate: Arrived',
  }[journey?.journey_status]

  const options = (() => {
    if (chat.typing) return []
    switch (chat.step) {
      case 'menu': return [['Enter accommodation', askDestination], ['View safety tips', tips], ['Emergency assistance', emergency]]
      case 'fare': return [['Request verified driver', requestDriver], ['Use Uber/Bolt', useRideHailing], ['Show safety checklist', checklist]]
      case 'fare_alt': return [['Request verified driver', requestDriver], ['Show safety checklist', checklist], ['View safety tips', tips]]
      case 'driver': return [['Confirm driver details', confirmDriver], ["Details don't match", () => startIncident("Details don't match", 'vehicle_mismatch', 'Do not enter the vehicle. Stay inside the terminal or another busy public area.')]]
      case 'share': return [['Share with hotel', () => share('hotel')], ['Share with trusted contact', () => share('contact')], ['Skip', skipShare]]
      case 'trip': return [...(nextTripLabel ? [[nextTripLabel, advanceTrip]] : []), ['I need help', () => startIncident('I need help')], ['Show safety checklist', checklist]]
      case 'arrival': return [['Yes, I arrived safely', confirmArrival], ['No, I need help', () => startIncident('No, I need help')]]
      case 'incident_category': return TOURIST_INCIDENT_OPTIONS.map(([l, c]) => [l, () => chooseCategory(l, c)])
      case 'incident_details': return [['Skip description', () => finishIncident('')]]
      case 'incident_done': return [['Emergency assistance', emergency], ['View safety tips', tips], ['Report a scam', scam]]
      case 'done': return [['😊 Great', () => feedback('😊 Great')], ['😐 Okay', () => feedback('😐 Okay')], ['🙁 Poor', () => feedback('🙁 Poor')]]
      case 'finished': return [['View safety tips', tips], ['Report a scam', scam]]
      default: return []
    }
  })()

  /** Free-text input from the composer. */
  const send = (text) => {
    const t = text.trim()
    if (!t || chat.typing) return
    if (chat.step === 'destination') return chooseDestination(t)
    if (chat.step === 'incident_details') return finishIncident(t)
    user(t)
    if (/help|emergency|danger|police|ambulance/i.test(t)) { onEmergency?.(); return say([{ kind: 'emergency' }]) }
    say(["I'm a demo assistant with guided options — please choose one of the buttons below."])
  }

  const placeholder = chat.step === 'destination' ? 'Type your hotel or address…' : chat.step === 'incident_details' ? 'Describe what happened…' : 'Message'

  return { chat, journey, options, send, start, chooseDestination, advanceTrip, nextTripLabel, placeholder, setChat }
}

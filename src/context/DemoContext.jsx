import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { toast } from 'sonner'
import { buildSeed, TABLES } from '../data/demoData'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { journeyService } from '../services/journeyService'
import { incidentService } from '../services/incidentService'
import { driverService } from '../services/driverService'
import { scamService } from '../services/scamService'
import { hotelService } from '../services/hotelService'
import {
  DEFAULT_SEVERITY, INCIDENT_CATEGORIES, newCaseReference, newShareToken, newVerificationCode,
  nextJourneyReference, uuid,
} from '../lib/journeyUtils'

const STATE_KEY = 'csa-demo-state-v1'
const CHAT_KEY = 'csa-chat-v1'
const TICK_KEY = 'csa-ticker'
const TAB_ID = uuid()

export const initialChat = () => ({
  started: false, touristName: 'Sarah M.', messages: [], step: 'welcome', typing: false,
  journeyId: null, incidentId: null, checklist: Array(7).fill(false),
})

const emptyTables = () => Object.fromEntries(TABLES.map((t) => [t, []]))

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}

function initState() {
  const chat = readJSON(CHAT_KEY) ?? initialChat()
  if (isSupabaseConfigured) return { ...emptyTables(), chat: { ...chat, typing: false } }
  const saved = readJSON(STATE_KEY)
  return saved?.journeys ? { ...saved, chat: { ...chat, typing: false } } : { ...buildSeed(), chat }
}

function reducer(state, a) {
  switch (a.type) {
    case 'replace': return a.state
    case 'set': return { ...state, [a.table]: a.rows }
    case 'upsert': {
      const rows = state[a.table]
      return rows.some((r) => r.id === a.row.id)
        ? { ...state, [a.table]: rows.map((r) => (r.id === a.row.id ? { ...r, ...a.row } : r)) }
        : { ...state, [a.table]: [a.row, ...rows] }
    }
    case 'patch': return { ...state, [a.table]: state[a.table].map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)) }
    case 'remove': return { ...state, [a.table]: state[a.table].filter((r) => r.id !== a.id) }
    case 'chat': return { ...state, chat: typeof a.update === 'function' ? a.update(state.chat) : { ...state.chat, ...a.update } }
    default: return state
  }
}

const DemoContext = createContext(null)

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const [mode, setMode] = useState(isSupabaseConfigured ? 'supabase' : 'demo')
  const [connection, setConnection] = useState(isSupabaseConfigured ? 'connecting' : 'demo')
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const stateRef = useRef(state)
  const modeRef = useRef(mode)
  useLayoutEffect(() => { stateRef.current = state; modeRef.current = mode })
  const timers = useRef(new Set())

  // ---------- Supabase load + realtime ------------------------------------
  const loadAll = useCallback(async () => {
    const [hotels, drivers, journeys, journey_updates, incidents, incident_notes, scam_reports, notifications] = await Promise.all([
      hotelService.list(), driverService.list(), journeyService.list(), journeyService.listUpdates(),
      incidentService.list(), incidentService.listNotes(), scamService.list(), hotelService.listNotifications(),
    ])
    const tables = { hotels, drivers, journeys, journey_updates, incidents, incident_notes, scam_reports, notifications }
    for (const t of TABLES) dispatch({ type: 'set', table: t, rows: tables[t] ?? [] })
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let channel
    loadAll()
      .then(() => {
        channel = supabase.channel('csa-realtime')
        for (const table of TABLES) {
          channel.on('postgres_changes', { event: '*', schema: 'public', table }, (p) => {
            if (p.eventType === 'DELETE') dispatch({ type: 'remove', table, id: p.old.id })
            else dispatch({ type: 'upsert', table, row: p.new })
          })
        }
        channel.subscribe((status) => setConnection(status === 'SUBSCRIBED' ? 'live' : ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status) ? 'offline' : 'connecting'))
      })
      .catch((e) => {
        console.warn('Supabase unavailable, falling back to demo data:', e.message)
        toast.warning('Could not reach Supabase — running on local demo data.')
        setMode('demo')
        setConnection('offline')
        dispatch({ type: 'replace', state: { ...buildSeed(), chat: stateRef.current.chat } })
      })
      .finally(() => setLoading(false))
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [loadAll])

  useEffect(() => {
    const off = () => setConnection('offline')
    const on = () => setConnection(modeRef.current === 'supabase' ? 'live' : 'demo')
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on) }
  }, [])

  // ---------- Local persistence + cross-tab sync (demo mode) --------------
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(state.chat))
      if (mode === 'demo') {
        const { chat: _chat, ...tables } = state
        localStorage.setItem(STATE_KEY, JSON.stringify(tables))
      }
    } catch { /* storage full or blocked — demo keeps working in memory */ }
  }, [state, mode])

  useEffect(() => {
    const onStorage = (e) => {
      if (!e.newValue) return
      if (e.key === CHAT_KEY) dispatch({ type: 'chat', update: JSON.parse(e.newValue) })
      if (e.key === STATE_KEY && modeRef.current === 'demo') dispatch({ type: 'replace', state: { ...JSON.parse(e.newValue), chat: stateRef.current.chat } })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ---------- Write helpers -------------------------------------------------
  const sync = useCallback((fn) => {
    if (modeRef.current !== 'supabase') return
    fn().catch((e) => toast.error(`Sync failed: ${e.message}`))
  }, [])

  const notify = useCallback((n) => {
    const row = { id: uuid(), read_at: null, created_at: new Date().toISOString(), recipient_id: null, journey_id: null, ...n }
    dispatch({ type: 'upsert', table: 'notifications', row })
    sync(() => hotelService.notify(row))
  }, [sync])

  const addJourneyUpdate = useCallback((journey_id, status, description) => {
    const row = { id: uuid(), journey_id, status, latitude: null, longitude: null, description, created_at: new Date().toISOString() }
    dispatch({ type: 'upsert', table: 'journey_updates', row })
    sync(() => journeyService.addUpdate(row))
  }, [sync])

  const getJourney = (id) => stateRef.current.journeys.find((j) => j.id === id)

  const createJourney = useCallback(({ touristName, destination, fare }) => {
    const now = new Date().toISOString()
    const row = {
      id: uuid(), journey_reference: nextJourneyReference(stateRef.current.journeys), tourist_name: touristName?.trim() || null,
      tourist_phone: null, hotel_id: destination.hotelId, destination: destination.name, destination_area: destination.area,
      destination_lat: destination.lat, destination_lng: destination.lng, driver_id: null, verification_code: null,
      estimated_fare: fare.estimate, fare_min: fare.min, fare_max: fare.max, fare_currency: 'ZAR',
      estimated_distance_km: fare.km, estimated_duration_min: fare.midMinutes, estimated_arrival: null, actual_arrival: null,
      journey_status: 'awaiting_transport', safety_status: 'pending', share_token: newShareToken(), share_enabled: false,
      share_target: null, pickup_location: 'Cape Town International Airport — Arrivals', route_progress: 0,
      started_at: null, completed_at: null, created_at: now, updated_at: now,
    }
    dispatch({ type: 'upsert', table: 'journeys', row })
    sync(() => journeyService.create(row))
    addJourneyUpdate(row.id, 'awaiting_transport', `Journey created to ${row.destination}`)
    return row
  }, [sync, addJourneyUpdate])

  /** Patch a journey; optionally log an update and notify the hotel (if shared). */
  const updateJourney = useCallback((id, patch, { log, hotelNote } = {}) => {
    const full = { ...patch, updated_at: new Date().toISOString() }
    dispatch({ type: 'patch', table: 'journeys', id, patch: full })
    sync(() => journeyService.update(id, full))
    if (log) addJourneyUpdate(id, patch.journey_status ?? getJourney(id)?.journey_status, log)
    const j = { ...getJourney(id), ...patch }
    if (hotelNote && j.share_enabled && j.hotel_id) notify({ recipient_type: 'hotel', recipient_id: j.hotel_id, journey_id: id, ...hotelNote })
  }, [sync, addJourneyUpdate, notify])

  const assignDriver = useCallback((journeyId) => {
    const { drivers, journeys } = stateRef.current
    const busy = new Set(journeys.filter((j) => ['driver_assigned', 'driver_confirmed', 'picked_up', 'on_route'].includes(j.journey_status) && j.id !== journeyId).map((j) => j.driver_id))
    const verified = drivers.filter((d) => d.verification_status === 'verified')
    // Prefer Thabo (the scripted demo driver), then any free verified driver.
    const driver = verified.find((d) => d.driver_reference === 'CPT-DRV-001') ?? verified.find((d) => !busy.has(d.id)) ?? verified[0]
    if (!driver) return null
    const j = getJourney(journeyId)
    const code = newVerificationCode()
    updateJourney(journeyId, {
      driver_id: driver.id, verification_code: code,
      estimated_arrival: new Date(Date.now() + ((j?.estimated_duration_min ?? 25) + 5) * 60000).toISOString(),
    }, { log: `Verified demo driver ${driver.full_name} offered (${driver.registration_number})` })
    return { driver, code }
  }, [updateJourney])

  const shareJourney = useCallback((journeyId, target) => {
    const j = getJourney(journeyId)
    updateJourney(journeyId, { share_enabled: true, share_target: target }, { log: target === 'hotel' ? 'Journey shared with accommodation' : 'Journey shared with a trusted contact' })
    if (target === 'hotel' && j?.hotel_id) {
      notify({ recipient_type: 'hotel', recipient_id: j.hotel_id, journey_id: journeyId, title: 'Journey shared', message: `${j.tourist_name || 'A guest'} shared their journey from the airport (${j.journey_reference}).`, notification_type: 'journey_shared' })
      const d = stateRef.current.drivers.find((x) => x.id === j.driver_id)
      if (d) notify({ recipient_type: 'hotel', recipient_id: j.hotel_id, journey_id: journeyId, title: 'Driver assigned', message: `${d.full_name} · ${d.vehicle_colour} ${d.vehicle_make} ${d.vehicle_model} · ${d.registration_number}`, notification_type: 'driver_assigned' })
    }
  }, [updateJourney, notify])

  const createIncident = useCallback(({ journeyId = null, category = 'other', description = '', touristReference }) => {
    const now = new Date().toISOString()
    const j = journeyId ? getJourney(journeyId) : null
    const hotelNotified = Boolean(j?.share_enabled && j?.hotel_id)
    const row = {
      id: uuid(), case_reference: newCaseReference(stateRef.current.incidents), journey_id: journeyId, category,
      severity: DEFAULT_SEVERITY[category] ?? 'medium', description: description.trim(), incident_status: 'new',
      hotel_notified: hotelNotified, tourist_reference: touristReference || j?.tourist_name || 'Anonymous visitor',
      resolution: null, created_at: now, updated_at: now, resolved_at: null,
    }
    dispatch({ type: 'upsert', table: 'incidents', row })
    sync(() => incidentService.create(row))
    if (j) updateJourney(j.id, { journey_status: 'incident_reported', safety_status: 'incident' }, {
      log: `Tourist reported a problem — case ${row.case_reference}`,
      hotelNote: { title: 'Safety alert', message: `${j.tourist_name || 'Your guest'} reported a problem during their journey (case ${row.case_reference}).`, notification_type: 'incident_reported' },
    })
    notify({ recipient_type: 'operations', journey_id: journeyId, title: 'Incident reported', message: `${row.case_reference} · ${INCIDENT_CATEGORIES[category]}${j ? ` on ${j.journey_reference}` : ''}`, notification_type: 'incident_reported' })
    return row
  }, [sync, updateJourney, notify])

  const updateIncident = useCallback((id, patch) => {
    const full = { ...patch, updated_at: new Date().toISOString() }
    if (['resolved', 'closed'].includes(patch.incident_status)) full.resolved_at = full.updated_at
    dispatch({ type: 'patch', table: 'incidents', id, patch: full })
    sync(() => incidentService.update(id, full))
  }, [sync])

  const addIncidentNote = useCallback((incident_id, note) => {
    const row = { id: uuid(), incident_id, author_id: null, note: note.trim(), created_at: new Date().toISOString() }
    dispatch({ type: 'upsert', table: 'incident_notes', row })
    sync(() => incidentService.addNote(row))
  }, [sync])

  const updateDriver = useCallback((id, patch) => {
    dispatch({ type: 'patch', table: 'drivers', id, patch })
    sync(() => driverService.update(id, patch))
  }, [sync])

  const createScamReport = useCallback((r) => {
    const row = { id: uuid(), severity: 'medium', verification_status: 'unverified', anonymous: true, created_at: new Date().toISOString(), ...r }
    dispatch({ type: 'upsert', table: 'scam_reports', row })
    sync(() => scamService.create(row))
    return row
  }, [sync])

  const markNotificationsRead = useCallback((ids) => {
    const at = new Date().toISOString()
    for (const id of ids) {
      dispatch({ type: 'patch', table: 'notifications', id, patch: { read_at: at } })
      sync(() => hotelService.markRead(id, at))
    }
  }, [sync])

  // ---------- Chat helpers ----------------------------------------------------
  const setChat = useCallback((update) => dispatch({ type: 'chat', update }), [])
  const schedule = useCallback((fn, ms) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }, [])

  const resetDemo = useCallback(async () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    if (modeRef.current === 'supabase') {
      try {
        await journeyService.resetDemo()
        await loadAll()
      } catch (e) {
        toast.error(`Reset failed: ${e.message}`)
        return
      }
      dispatch({ type: 'chat', update: initialChat() })
    } else {
      dispatch({ type: 'replace', state: { ...buildSeed(), chat: initialChat() } })
    }
    toast.success('Demo reset to its starting state')
  }, [loadAll])

  // ---------- Simulated trip progress -----------------------------------------
  // Advances the tourist's own journey while "on route". One tab leads via a
  // localStorage heartbeat so two open windows don't double-advance it.
  useEffect(() => {
    const iv = setInterval(() => {
      const lead = readJSON(TICK_KEY)
      if (lead && lead.tab !== TAB_ID && Date.now() - lead.ts < 5000) return
      localStorage.setItem(TICK_KEY, JSON.stringify({ tab: TAB_ID, ts: Date.now() }))
      const j = getJourney(stateRef.current.chat.journeyId)
      if (!j || j.journey_status !== 'on_route' || j.route_progress >= 0.92) return
      const p = Math.min(0.92, (j.route_progress ?? 0) + 0.06)
      updateJourney(j.id, { route_progress: p, estimated_arrival: new Date(Date.now() + Math.max(1, (1 - p) * j.estimated_duration_min) * 60000).toISOString() })
    }, 2500)
    return () => clearInterval(iv)
  }, [updateJourney])

  const value = useMemo(() => ({
    ...state, state, mode, connection, loading,
    createJourney, updateJourney, assignDriver, shareJourney, createIncident, updateIncident, addIncidentNote,
    updateDriver, createScamReport, markNotificationsRead, notify, setChat, schedule, resetDemo,
    driverById: (id) => state.drivers.find((d) => d.id === id),
    hotelById: (id) => state.hotels.find((h) => h.id === id),
  }), [state, mode, connection, loading, createJourney, updateJourney, assignDriver, shareJourney, createIncident,
    updateIncident, addIncidentNote, updateDriver, createScamReport, markNotificationsRead, notify, setChat, schedule, resetDemo])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDemo = () => useContext(DemoContext)

// Demo fare & route engine. Every number here is ILLUSTRATIVE — not a live
// quote from Uber, Bolt or any operator. Real integration: provider APIs.

export const AIRPORT = { name: 'Cape Town International Airport', lat: -33.9715, lng: 18.6021 }

// Rough N2 corridor from the airport into the city (demo route points only).
const N2_TO_CITY = [
  [-33.9715, 18.6021], [-33.964, 18.586], [-33.956, 18.555], [-33.948, 18.525],
  [-33.943, 18.496], [-33.938, 18.472], [-33.93, 18.45], [-33.925, 18.43],
]

export const AREAS = {
  cbd: {
    label: 'Cape Town CBD', min: 250, max: 350, km: 21, minutes: [20, 30],
    lat: -33.9249, lng: 18.4241, path: [...N2_TO_CITY, [-33.9249, 18.4241]],
  },
  waterfront: {
    label: 'V&A Waterfront', min: 280, max: 380, km: 23, minutes: [22, 32],
    lat: -33.9065, lng: 18.4215, path: [...N2_TO_CITY, [-33.918, 18.428], [-33.9065, 18.4215]],
  },
  sea_point: {
    label: 'Sea Point', min: 320, max: 420, km: 26, minutes: [25, 35],
    lat: -33.915, lng: 18.388, path: [...N2_TO_CITY, [-33.92, 18.415], [-33.912, 18.402], [-33.915, 18.388]],
  },
  camps_bay: {
    label: 'Camps Bay', min: 400, max: 550, km: 29, minutes: [30, 40],
    lat: -33.951, lng: 18.377, path: [...N2_TO_CITY, [-33.93, 18.415], [-33.938, 18.403], [-33.945, 18.39], [-33.951, 18.377]],
  },
  century_city: {
    label: 'Century City', min: 350, max: 500, km: 19, minutes: [20, 30],
    lat: -33.8915, lng: 18.511,
    path: [[-33.9715, 18.6021], [-33.964, 18.586], [-33.945, 18.56], [-33.92, 18.535], [-33.9, 18.52], [-33.8915, 18.511]],
  },
  stellenbosch: {
    label: 'Stellenbosch', min: 650, max: 950, km: 37, minutes: [35, 50],
    lat: -33.9321, lng: 18.8602,
    path: [[-33.9715, 18.6021], [-33.975, 18.64], [-33.985, 18.7], [-33.97, 18.77], [-33.95, 18.82], [-33.9321, 18.8602]],
  },
}

// Suggested destinations. Hotel names are used for demonstration only —
// no partnership with these properties is implied.
export const DESTINATIONS = [
  { id: 'rockefeller', name: 'The Rockefeller Hotel', area: 'cbd', lat: -33.9165, lng: 18.417, hotelId: '11111111-1111-4111-8111-000000000001', fare: { min: 280, max: 350, estimate: 310 } },
  { id: 'marriott', name: 'Cape Town Marriott Hotel Crystal Towers', area: 'century_city', lat: -33.8915, lng: 18.511, hotelId: '11111111-1111-4111-8111-000000000002' },
  { id: 'radisson', name: 'Radisson RED V&A Waterfront', area: 'waterfront', lat: -33.9085, lng: 18.4235, hotelId: '11111111-1111-4111-8111-000000000003' },
  { id: 'sky', name: 'Hotel Sky Cape Town', area: 'cbd', lat: -33.9205, lng: 18.4245, hotelId: '11111111-1111-4111-8111-000000000004' },
  { id: 'silo', name: 'The Silo Hotel', area: 'waterfront', lat: -33.908, lng: 18.423, hotelId: '11111111-1111-4111-8111-000000000005' },
  { id: 'cbd', name: 'Cape Town International Airport to CBD', area: 'cbd', lat: -33.9249, lng: 18.4241, hotelId: null },
]

const KEYWORDS = [
  ['stellenbosch', 'stellenbosch'], ['camps bay', 'camps_bay'], ['sea point', 'sea_point'],
  ['century', 'century_city'], ['waterfront', 'waterfront'], ['v&a', 'waterfront'], ['va ', 'waterfront'],
]

export function matchArea(text) {
  const t = ` ${text.toLowerCase()} `
  return KEYWORDS.find(([k]) => t.includes(k))?.[1] ?? 'cbd'
}

/** Resolve free text or a suggestion into a destination object. */
export function resolveDestination(input) {
  const text = input.trim()
  const known = DESTINATIONS.find((d) => d.name.toLowerCase() === text.toLowerCase())
  if (known) return { ...known, custom: false }
  const area = matchArea(text)
  const a = AREAS[area]
  return { id: 'custom', name: text, area, lat: a.lat, lng: a.lng, hotelId: null, custom: true }
}

const round10 = (n) => Math.round(n / 10) * 10
const round5 = (n) => Math.round(n / 5) * 5

export function estimateFare(dest) {
  const a = AREAS[dest.area] ?? AREAS.cbd
  const min = dest.fare?.min ?? a.min
  const max = dest.fare?.max ?? a.max
  const estimate = dest.fare?.estimate ?? round10((min + max) / 2)
  const midMinutes = (a.minutes[0] + a.minutes[1]) / 2
  const base = 45
  const pickup = 25
  const time = round5(midMinutes * 1.2)
  const distance = estimate - base - pickup - time
  return {
    min, max, estimate, currency: 'ZAR',
    km: a.km, minutes: a.minutes, midMinutes, areaLabel: a.label,
    breakdown: [
      { label: 'Base fare', amount: base },
      { label: `Distance (≈${a.km} km)`, amount: distance },
      { label: 'Time & traffic allowance', amount: time },
      { label: 'Airport pickup allowance', amount: pickup },
    ],
  }
}

export const FARE_DISCLAIMER =
  'Your estimated fare is based on our demo travel information. Actual ride-hailing fares may vary due to traffic, demand, route, and provider pricing.'

export const rand = (n) => `R${Math.round(n).toLocaleString('en-ZA')}`

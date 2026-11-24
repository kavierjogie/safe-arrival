import { Fragment } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { Radio } from 'lucide-react'
import { AIRPORT, routeFor, vehiclePosition, guestRef } from '../../lib/journeyUtils'

const car = (color) => L.divIcon({
  className: 'vehicle-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: `<div style="width:30px;height:30px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(16,36,58,.35);display:grid;place-items:center">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
  </div>`,
})
const CAR = { teal: car('#13A89E'), red: car('#DC5353'), amber: car('#E9A23B') }
const CAPE_TOWN = [[-34.0, 18.35], [-33.86, 18.9]]
const showsVehicle = (j) => ['picked_up', 'on_route', 'arrived', 'safety_check_pending', 'incident_reported'].includes(j.journey_status)

/**
 * Demo map. Positions are interpolated along hand-drawn route points — this is
 * NOT live GPS. Real integration: consented driver-device location feed.
 */
export default function JourneyMap({ journey, journeys, height = 'h-72', onSelect }) {
  const list = journey ? [journey] : journeys ?? []
  const bounds = journey ? L.latLngBounds(routeFor(journey)).pad(0.15) : CAPE_TOWN

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 ${height}`}>
      <MapContainer key={journey?.id ?? 'all'} bounds={bounds} scrollWheelZoom={false} className="h-full w-full" attributionControl>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        <CircleMarker center={[AIRPORT.lat, AIRPORT.lng]} radius={8} pathOptions={{ color: '#10243A', fillColor: '#10243A', fillOpacity: 1 }}>
          <Tooltip>Cape Town International Airport (pickup)</Tooltip>
        </CircleMarker>
        {list.map((j) => {
          const path = routeFor(j)
          const tone = j.safety_status === 'incident' ? 'red' : j.safety_status === 'alert' ? 'amber' : 'teal'
          const lineColor = { red: '#DC5353', amber: '#E9A23B', teal: '#13A89E' }[tone]
          return (
            <Fragment key={j.id}>
              <Polyline positions={path} pathOptions={{ color: lineColor, weight: journey ? 5 : 3, opacity: journey ? 0.85 : 0.5, dashArray: j.journey_status === 'awaiting_transport' ? '6 8' : undefined }} />
              <CircleMarker center={path[path.length - 1]} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#21A675', fillOpacity: 1 }}>
                <Tooltip>{j.destination}</Tooltip>
              </CircleMarker>
              {showsVehicle(j) && (
                <Marker position={vehiclePosition(j)} icon={CAR[tone]} eventHandlers={onSelect ? { click: () => onSelect(j) } : undefined}>
                  <Tooltip>{journey ? 'Simulated vehicle position' : `${j.journey_reference} · ${guestRef(j)}`}</Tooltip>
                </Marker>
              )}
            </Fragment>
          )
        })}
      </MapContainer>
      <div className="pointer-events-none absolute right-2 top-2 z-[400] inline-flex items-center gap-1.5 rounded-md bg-navy/90 px-2 py-1 text-[11px] font-semibold text-white">
        <Radio className="size-3.5 text-amber" aria-hidden />Simulated journey location — demo mode
      </div>
    </div>
  )
}

import { PublicHeader } from '../components/layout/Layouts'

const SECTIONS = [
  ['What this prototype is', 'Cape Town Safe Arrival is a hackathon prototype. The WhatsApp conversation is simulated in your browser; no messages are sent through WhatsApp, and no one is contacted on your behalf. Drivers, guests, incidents and scam reports are fictional demo data.'],
  ['What we collect in the demo', 'Your optional first name, the destination you choose, journey status changes, and anything you type into a report. In Demo Mode this stays in your browser\'s local storage and is cleared by "Reset Demo". When connected to Supabase, the same fields are stored in the project database.'],
  ['Sharing is your choice', 'Your accommodation only sees your journey if you tap "Share with hotel". Tracking links use a random token and show only what\'s needed to follow the trip: first name or guest reference, destination, driver name, vehicle, registration, status, ETA and simulated progress.'],
  ['What is never shown publicly', 'Phone numbers, your driver verification code, and incident descriptions are never included in tracking links. Hotel staff see the verification code masked and must deliberately reveal it.'],
  ['Location', 'There is no GPS tracking. Vehicle positions on maps are simulated along a demo route. A production version would only use location shared with consent from the driver\'s device.'],
  ['Scam reports', 'Scam reports are anonymous. Please don\'t include names, phone numbers or other personal details in descriptions.'],
  ['POPIA', 'A production rollout in South Africa would need a lawful basis, purpose limitation, retention limits and data-subject rights handling under the Protection of Personal Information Act (POPIA), plus agreements with partner hotels and transport providers.'],
]

export default function PrivacyPage() {
  return (
    <div className="pb-24">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Privacy information</h1>
        <p className="mt-2 text-muted">Plain-language summary of how this prototype handles data.</p>
        <div className="mt-8 space-y-7">
          {SECTIONS.map(([h, p]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold">{h}</h2>
              <p className="mt-1.5 leading-relaxed text-slate-700">{p}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

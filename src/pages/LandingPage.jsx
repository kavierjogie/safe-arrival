import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Building2, CheckCheck, MessageCircle, Plane, QrCode, Receipt, Route as RouteIcon, ShieldCheck, Siren, Lightbulb, MapPin } from 'lucide-react'
import { PublicHeader } from '../components/layout/Layouts'
import { Button } from '../components/common/ui'

const FEATURES = [
  [BadgeCheck, 'Verified transport', 'Know who your driver is before getting into the vehicle — name, car, registration and a one-time verification code.'],
  [Receipt, 'Transparent fares', 'See an estimated fare range and breakdown before your journey begins, so you can spot overcharging.'],
  [Building2, 'Hotel-connected journeys', 'Keep your accommodation informed of your arrival with a private tracking link.'],
  [RouteIcon, 'Journey monitoring', 'Track your journey stage by stage and know when you are expected to arrive.'],
  [Siren, 'Safety support', 'Report problems in a tap and receive a case reference. Emergency numbers are always one tap away.'],
  [Lightbulb, 'Tourist intelligence', 'Anonymised reports reveal recurring scams so visitors and stakeholders can act early.'],
]

const STEPS = [
  [QrCode, 'Scan the airport QR code', 'Posters in arrivals open a WhatsApp chat on airport Wi-Fi — no app download.'],
  [MessageCircle, 'Chat with Safe Arrival on WhatsApp', 'A friendly assistant guides you in plain language.'],
  [MapPin, 'Confirm your destination and transport', 'See your fare estimate and get a verified driver with a code.'],
  [Building2, 'Share your journey with your accommodation', 'Your hotel sees your driver, vehicle and ETA.'],
  [CheckCheck, 'Confirm safe arrival', 'One tap closes the loop — or raises an alert if something is wrong.'],
]

const B = ({ me, children }) => (
  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-snug shadow-sm ${me ? 'ml-auto rounded-tr-none bg-bubble-out' : 'rounded-tl-none bg-white'}`}>{children}</div>
)

function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2.2rem] bg-navy p-2.5 shadow-2xl ring-1 ring-white/10" aria-hidden>
      <div className="overflow-hidden rounded-[1.8rem]">
        <div className="flex items-center gap-2 bg-deep px-4 py-3 text-white">
          <span className="grid size-8 place-items-center rounded-full bg-teal"><ShieldCheck className="size-4" /></span>
          <div><p className="flex items-center gap-1 text-sm font-semibold">Cape Town Safe Arrival <BadgeCheck className="size-3.5 text-teal" /></p><p className="text-[11px] text-white/70">Business account · preview</p></div>
        </div>
        <div className="chat-pattern space-y-2 px-3 py-4 text-navy">
          <B>Welcome to Cape Town! 👋 Where are you heading today?</B>
          <B me>The Rockefeller Hotel</B>
          <B>Estimated fare: <strong>R280–R350</strong><br />Travel time: 20–30 min</B>
          <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white p-2.5 text-[13px] shadow-sm">
            <p className="font-semibold">Thabo Mokoena · ★ 4.8</p>
            <p className="text-muted">White Toyota Corolla · <span className="font-mono">CA 123-456</span></p>
            <p className="mt-1.5 rounded bg-navy px-2 py-1 text-center font-mono font-bold tracking-[0.3em] text-white">4821</p>
          </div>
          <B>✅ Your hotel has been notified that you're on your way.</B>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="pb-20">
      <PublicHeader dark />
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 lg:grid-cols-[1.2fr_1fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90"><Plane className="size-3.5 text-teal" aria-hidden />Cape Town International Airport · hackathon prototype</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Your Cape Town journey starts with <span className="text-teal">safety.</span></h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">From the moment you land, Cape Town Safe Arrival connects you to verified transport, your accommodation, and the support you need to reach your destination with confidence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/demo" size="lg">Start Safe Arrival Demo<ArrowRight className="size-4" aria-hidden /></Button>
              <Button as={Link} to="/operations" size="lg" variant="outline" className="!bg-transparent !text-white !ring-white/30 hover:!bg-white/10">Explore the Safety Dashboard</Button>
            </div>
            <p className="mt-8 text-sm font-medium tracking-wide text-white/60">Land safely. Ride confidently. Arrive connected.</p>
          </div>
          <PhonePreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">A safety layer for the first ride in a new city</h2>
          <p className="mt-3 text-muted">Safe Arrival doesn't own a fleet or compete with ride-hailing. It verifies, coordinates and keeps everyone accountable — over the messaging app visitors already use.</p>
        </div>
        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([Icon, title, text]) => (
            <div key={title} className="border-t-2 border-teal pt-5">
              <Icon className="size-6 text-teal-ink" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-5">
            {STEPS.map(([Icon, title, text], i) => (
              <li key={title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
                  {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-slate-300 md:block" aria-hidden />}
                </div>
                <Icon className="mt-4 size-5 text-teal-ink" aria-hidden />
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-deep px-8 py-12 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Arrive in Cape Town with confidence.</h2>
            <p className="mt-2 text-white/70">Walk through the full journey in under three minutes — tourist, hotel and operations views stay in sync.</p>
          </div>
          <Button as={Link} to="/demo" size="lg">Start Safe Arrival Demo<ArrowRight className="size-4" aria-hidden /></Button>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 text-xs text-muted">
        <p>Hackathon prototype. The WhatsApp experience is simulated; fares, drivers, guests and incidents are fictional demo data. Hotel names are used for illustration only and imply no partnership. <Link to="/privacy" className="font-medium text-teal-ink underline">Privacy</Link></p>
      </footer>
    </div>
  )
}

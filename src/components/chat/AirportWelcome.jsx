import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Plane, Wifi, MessageCircle } from 'lucide-react'

/** Step 1: the arrivals-hall poster a tourist scans. */
export default function AirportWelcome({ onStart, defaultName }) {
  const [name, setName] = useState(defaultName)
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-navy to-deep px-5 py-6 text-white">
      <div className="flex items-center gap-2 text-xs font-medium text-white/70"><Plane className="size-4 text-teal" aria-hidden />Cape Town International Airport · Arrivals</div>
      <h2 className="mt-4 text-2xl font-bold leading-tight">Welcome to Cape Town</h2>
      <p className="mt-1 text-sm text-white/75">Scan to get verified transport and safety help on WhatsApp — no app download.</p>

      <div className="mx-auto mt-5 rounded-2xl bg-white p-3">
        <QRCodeSVG value={`${window.location.origin}/demo`} size={148} fgColor="#10243A" title="QR code that opens the Safe Arrival demo" />
      </div>
      <p className="mt-2 text-center text-[11px] text-white/60">Demo QR — opens this preview</p>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/10 p-3 text-xs">
        <Wifi className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
        <p>Connect to free airport Wi-Fi first. WhatsApp works without a local SIM card. <span className="text-white/60">(Illustrative — check airport signage for the actual network.)</span></p>
      </div>

      <label className="mt-5 block text-xs font-medium text-white/80" htmlFor="tourist-name">Your first name (optional — only shared if you choose)</label>
      <input id="tourist-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
        className="mt-1 w-full rounded-lg bg-white/95 px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal" />

      <button onClick={() => onStart(name.trim().slice(0, 40))} className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-semibold text-navy shadow-lg hover:bg-[#1fbf5b]">
        <MessageCircle className="size-5" aria-hidden />Start WhatsApp Conversation
      </button>
    </div>
  )
}

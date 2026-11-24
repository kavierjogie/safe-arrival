import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BadgeCheck, MoreVertical, Phone, SendHorizontal, ShieldCheck, Siren } from 'lucide-react'
import { DESTINATIONS } from '../../lib/fareEstimator'
import ChatMessage from './ChatMessage'

/** WhatsApp-inspired chat surface (simulated — no messages leave the browser). */
export default function ChatWindow({ engine, onEmergency }) {
  const { chat, options, send, chooseDestination, placeholder } = engine
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [chat.messages.length, chat.typing, chat.step])
  useEffect(() => { if (['destination', 'incident_details'].includes(chat.step)) inputRef.current?.focus() }, [chat.step])

  const submit = (e) => {
    e.preventDefault()
    send(text)
    setText('')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-chat">
      <header className="flex items-center gap-2 bg-deep px-3 py-2.5 text-white">
        <ArrowLeft className="size-5 text-white/70" aria-hidden />
        <span className="grid size-9 place-items-center rounded-full bg-teal"><ShieldCheck className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">Cape Town Safe Arrival <BadgeCheck className="size-4 shrink-0 text-teal" aria-label="Verified business account" /></p>
          <p className="text-[11px] text-white/70" aria-live="polite">{chat.typing ? 'typing…' : 'Business account · online'}</p>
        </div>
        <button onClick={onEmergency} className="rounded-full p-2 text-white hover:bg-white/10" aria-label="Emergency assistance"><Siren className="size-5 text-amber" /></button>
        <Phone className="size-5 text-white/40" aria-hidden />
        <MoreVertical className="size-5 text-white/40" aria-hidden />
      </header>

      <div className="chat-pattern flex-1 space-y-2 overflow-y-auto px-3 py-4" role="log" aria-live="polite" aria-label="Conversation with Cape Town Safe Arrival">
        <p className="mx-auto w-fit rounded-md bg-white/80 px-2 py-1 text-center text-[11px] text-slate-600 shadow-sm">🔒 Simulated chat — WhatsApp Experience Preview. No messages are sent.</p>
        {chat.messages.map((m) => <ChatMessage key={m.id} m={m} />)}
        {chat.typing && (
          <div className="flex w-fit gap-1 rounded-lg rounded-tl-none bg-white px-3 py-3 shadow-sm" aria-label="Safe Arrival is typing">
            {[0, 1, 2].map((i) => <span key={i} className="typing-dot size-2 rounded-full bg-slate-400" />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {chat.step === 'destination' && !chat.typing && (
        <div className="border-t border-black/5 bg-white/70 px-3 py-2">
          <p className="mb-1.5 text-[11px] font-medium text-slate-600">Suggested destinations</p>
          <div className="flex flex-wrap gap-1.5">
            {DESTINATIONS.map((d) => (
              <button key={d.id} onClick={() => chooseDestination(d.name)} className="rounded-full border border-teal/40 bg-white px-3 py-1 text-xs font-medium text-teal-ink hover:bg-teal/10">{d.name}</button>
            ))}
            <button onClick={() => inputRef.current?.focus()} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Custom destination…</button>
          </div>
        </div>
      )}

      {options.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 border-t border-black/5 bg-white/70 px-3 py-2" role="group" aria-label="Quick replies">
          {options.map(([label, fn]) => (
            <button key={label} onClick={fn} className={`rounded-full px-3.5 py-1.5 text-sm font-medium shadow-sm ring-1 ${/help|don't match/i.test(label) ? 'bg-white text-alert-ink ring-alert/30 hover:bg-alert/5' : label.startsWith('▶') ? 'bg-navy text-white ring-navy hover:bg-deep' : 'bg-white text-teal-ink ring-teal/30 hover:bg-teal/5'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2 bg-[#f0f2f5] px-2 py-2">
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <input id="chat-input" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} autoComplete="off"
          placeholder={placeholder} className="min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal/40" />
        <button type="submit" disabled={!text.trim() || chat.typing} className="grid size-10 place-items-center rounded-full bg-teal text-white disabled:opacity-40" aria-label="Send message">
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  )
}

import { Check, Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNowStrict, format } from 'date-fns'
import { STAGES, stageIndex, formatEta, JOURNEY_STATUS } from '../../lib/journeyUtils'
import { Button } from '../common/ui'

/** Driver confirmed → Pickup → On route → Arrived stepper with progress bar. */
export function RouteProgress({ journey }) {
  const idx = stageIndex(journey.journey_status)
  const pct = Math.round((journey.route_progress ?? 0) * 100)
  return (
    <div>
      <ol className="grid grid-cols-4 gap-1" aria-label="Journey stages">
        {STAGES.map((s, i) => {
          const done = i <= idx
          return (
            <li key={s.key} className="flex flex-col items-center text-center">
              <span className={`grid size-7 place-items-center rounded-full border-2 text-xs font-semibold ${done ? 'border-safe bg-safe text-white' : 'border-slate-300 bg-white text-muted'}`}>
                {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className={`mt-1 text-[11px] leading-tight ${done ? 'font-medium text-navy' : 'text-muted'}`}>{s.label}<span className="sr-only">{done ? ' — done' : ' — not yet'}</span></span>
            </li>
          )
        })}
      </ol>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted"><span>Airport</span><span aria-live="polite">{pct}% of route · ETA {formatEta(journey)}</span><span>Destination</span></div>
        <div className="mt-1 h-2 rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Simulated route progress">
          <div className="h-full rounded-full bg-teal transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

export function JourneyTimeline({ updates }) {
  if (!updates.length) return <p className="text-sm text-muted">No updates yet.</p>
  return (
    <ol className="relative space-y-3 border-l border-slate-200 pl-4">
      {updates.map((u) => (
        <li key={u.id}>
          <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-teal" aria-hidden />
          <p className="text-sm">{u.description}</p>
          <p className="text-xs text-muted">{JOURNEY_STATUS[u.status] ?? u.status} · <time dateTime={u.created_at}>{format(new Date(u.created_at), 'HH:mm')}</time></p>
        </li>
      ))}
    </ol>
  )
}

export const trackingUrl = (j) => `${window.location.origin}/journey/${j.share_token}`

export async function copyText(text, msg = 'Tracking link copied') {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for insecure contexts / older browsers.
    const ta = Object.assign(document.createElement('textarea'), { value: text })
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    if (!ok) return toast.error('Copy failed — select the link and copy it manually.')
  }
  toast.success(msg)
}

export function TrackingLink({ journey, dark = false }) {
  const url = trackingUrl(journey)
  return (
    <div className={`flex items-center gap-2 rounded-lg p-2 ${dark ? 'bg-white/60' : 'bg-slate-50 ring-1 ring-slate-200'}`}>
      <Link2 className="size-4 shrink-0 text-teal-ink" aria-hidden />
      <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-medium text-teal-ink underline-offset-2 hover:underline">{url.replace(/^https?:\/\//, '')}</a>
      <Button size="sm" variant="outline" onClick={() => copyText(url)} aria-label="Copy tracking link"><Copy className="size-3.5" aria-hidden />Copy</Button>
    </div>
  )
}

export const ago = (iso) => (iso ? `${formatDistanceToNowStrict(new Date(iso))} ago` : '—')

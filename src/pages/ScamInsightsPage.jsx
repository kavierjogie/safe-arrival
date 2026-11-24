import { useState } from 'react'
import { Flag, Lightbulb, MapPin, ShieldAlert } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { PageHeader } from '../components/layout/Layouts'
import { Button, DemoTag, EmptyState, Panel, inputCls, inputW } from '../components/common/ui'
import { ScamVerificationBadge, SeverityBadge } from '../components/common/StatusBadges'
import { HBarChart, TrendChart, weeklyCounts } from '../components/common/Charts'
import { ago } from '../components/journey/JourneyBits'
import ScamReportDialog from '../components/safety/ScamReportDialog'
import { SAFETY_INSIGHTS } from '../data/demoData'
import { SCAM_CATEGORIES } from '../lib/journeyUtils'

export default function ScamInsightsPage() {
  const { scam_reports } = useDemo()
  const [open, setOpen] = useState(false)
  const [cat, setCat] = useState('all')

  const byCat = Object.entries(SCAM_CATEGORIES).map(([k, v]) => ({ name: v, value: scam_reports.filter((s) => s.category === k).length, color: '#173B57' })).filter((d) => d.value).sort((a, b) => b.value - a.value)
  const locations = Object.entries(scam_reports.reduce((m, s) => ({ ...m, [s.location]: (m[s.location] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const recent = scam_reports.filter((s) => cat === 'all' || s.category === cat).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const highShare = scam_reports.length ? Math.round((scam_reports.filter((s) => s.severity === 'high').length / scam_reports.length) * 100) : 0

  return (
    <>
      <PageHeader title="Scam reports & safety intelligence" subtitle="Anonymised visitor reports grouped into patterns. Sample data — not police statistics or verified real-world incidents.">
        <DemoTag>Sample reports</DemoTag>
        <Button onClick={() => setOpen(true)}><Flag className="size-4" aria-hidden />Report a scam</Button>
      </PageHeader>

      <section aria-labelledby="insights" className="mb-6 rounded-xl bg-navy p-5 text-white">
        <h2 id="insights" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-teal"><Lightbulb className="size-4" aria-hidden />Tourist safety insights · public view</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {SAFETY_INSIGHTS.map((t) => <li key={t} className="rounded-lg bg-white/5 p-3 text-sm leading-relaxed">“{t}”</li>)}
        </ul>
        <p className="mt-3 text-xs text-white/60">Derived from sample demo reports. Shown to visitors without any personal details.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Reports by category" className="lg:col-span-2" bodyClass="p-3"><HBarChart data={byCat} height={280} label="Reports" /></Panel>
        <Panel title="Reports per week" bodyClass="p-3">
          <TrendChart data={weeklyCounts(scam_reports)} height={200} />
          <p className="mt-2 px-1 text-xs text-muted">{scam_reports.length} reports · {highShare}% rated high severity</p>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel title="Reported locations">
          <ul className="divide-y divide-slate-100">
            {locations.map(([loc, n]) => (
              <li key={loc} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <MapPin className="size-4 shrink-0 text-teal-ink" aria-hidden /><span className="flex-1">{loc}</span><span className="font-semibold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recently reported" action={
          <select aria-label="Filter by category" className={`${inputW('w-auto')} py-1 text-xs`} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>{Object.entries(SCAM_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        }>
          {recent.length === 0 ? <EmptyState icon={ShieldAlert} title="No reports in this category" /> : (
            <ul className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto">
              {recent.map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{SCAM_CATEGORIES[s.category]}</span>
                    <SeverityBadge severity={s.severity} /><ScamVerificationBadge status={s.verification_status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{s.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin className="size-3" aria-hidden />{s.location} · {ago(s.created_at)} · anonymous</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <ScamReportDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}


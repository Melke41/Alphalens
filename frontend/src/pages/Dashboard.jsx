import { useState } from 'react'
import {
  Brain,
  TrendingUp,
  Gauge,
  ArrowUpDown,
  AlertTriangle,
  FileText,
  Send,
} from 'lucide-react'
import Card from '../components/Card'
import { sendResearchQuery } from '../utils/api'

function PlaceholderBlock({ label, rows = 4 }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded border border-terminal-border/60 bg-terminal-bg/50 px-3 py-2.5"
        >
          <div className="h-2 w-2 shrink-0 rounded-full bg-terminal-border" />
          <div
            className="h-2 flex-1 rounded bg-terminal-border/80"
            style={{ width: `${55 + (i % 3) * 12}%`, maxWidth: '100%' }}
          />
          <div className="h-2 w-12 shrink-0 rounded bg-terminal-border/60" />
        </div>
      ))}
      <p className="mt-auto pt-2 text-center font-mono text-[10px] text-terminal-muted/50">
        {label}
      </p>
    </div>
  )
}

function FearGreedGauge() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4">
      <div className="relative h-32 w-48">
        <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1f1f1f"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset="100"
            opacity="0.6"
          />
          <line
            x1="100"
            y1="100"
            x2="145"
            y2="55"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill="#0a0a0a" stroke="#3b82f6" strokeWidth="2" />
        </svg>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-terminal-accent">—</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-muted">
        Index placeholder
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSendQuery() {
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const data = await sendResearchQuery(trimmed)
      setResponse(data)
    } catch (err) {
      setError(err.message || 'Failed to reach AlphaLens backend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between border-b border-terminal-border pb-4">
        <div>
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
            Command Center
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
        </div>
        <p className="hidden font-mono text-xs text-terminal-muted sm:block">
          INSTITUTIONAL QUANT RESEARCH · REAL-TIME SHELL
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* AI Copilot — wide */}
        <Card
          title="AI Research Copilot"
          subtitle="Natural language quant research"
          accent="AI"
          className="xl:col-span-7"
        >
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-start gap-3 rounded-md border border-terminal-border bg-terminal-bg p-3">
              <Brain className="mt-0.5 h-5 w-5 shrink-0 text-terminal-accent" />
              <p className="font-mono text-xs leading-relaxed text-terminal-muted">
                Ask AlphaLens to analyze regimes, factor exposures, or macro
                scenarios. Full AI integration ships in the next phase.
              </p>
            </div>
            <div className="mt-auto space-y-3">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSendQuery()
                    }
                  }}
                  placeholder="e.g. Run a momentum factor backtest on US large-cap vs. current macro regime..."
                  rows={3}
                  disabled={loading}
                  className="w-full resize-none rounded-md border border-terminal-border bg-terminal-bg px-4 py-2.5 pr-12 font-mono text-sm text-terminal-text outline-none transition-colors placeholder:text-terminal-muted/60 focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleSendQuery}
                  disabled={loading || !query.trim()}
                  className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-md border border-terminal-accent/40 bg-terminal-accent/10 text-terminal-accent transition-colors hover:bg-terminal-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send query"
                >
                  <Send size={14} />
                </button>
              </div>

              {loading && (
                <p className="animate-pulse font-mono text-xs font-medium text-terminal-accent">
                  AlphaLens is thinking...
                </p>
              )}

              {error && !loading && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 font-mono text-xs text-red-400">
                  {error}
                </div>
              )}

              {response && !loading && (
                <div className="rounded-md border border-terminal-border bg-terminal-bg p-4">
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-accent">
                    Research Response
                  </p>
                  <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-terminal-text/90">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Market overview */}
        <Card
          title="Market Overview"
          subtitle="Cross-asset snapshot"
          className="xl:col-span-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-terminal-accent" />
            <span className="font-mono text-[10px] text-terminal-muted">
              MAJOR INDICES · FX · RATES
            </span>
          </div>
          <PlaceholderBlock label="Live market data — coming soon" rows={5} />
        </Card>

        {/* Fear & Greed */}
        <Card
          title="Fear & Greed Index"
          subtitle="Sentiment gauge"
          className="xl:col-span-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-terminal-accent" />
          </div>
          <FearGreedGauge />
        </Card>

        {/* Top movers */}
        <Card
          title="Top Movers"
          subtitle="Gainers & losers"
          className="xl:col-span-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-terminal-accent" />
          </div>
          <PlaceholderBlock label="Equity movers — coming soon" />
        </Card>

        {/* Macro alerts */}
        <Card
          title="Macro Alerts"
          subtitle="Fed · CPI · yields"
          className="xl:col-span-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-[10px] text-terminal-muted">
              EVENT CALENDAR
            </span>
          </div>
          <PlaceholderBlock label="Macro event feed — coming soon" rows={5} />
        </Card>

        {/* Research reports */}
        <Card
          title="Latest Research Reports"
          subtitle="Institutional PDF outputs"
          className="xl:col-span-12"
        >
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-terminal-accent" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-md border border-terminal-border bg-terminal-bg p-4 transition-colors hover:border-terminal-accent/20"
              >
                <div className="mb-3 h-1 w-8 rounded bg-terminal-accent/40" />
                <div className="mb-2 h-3 w-3/4 rounded bg-terminal-border" />
                <div className="mb-4 h-2 w-1/2 rounded bg-terminal-border/70" />
                <div className="h-2 w-full rounded bg-terminal-border/50" />
                <p className="mt-4 font-mono text-[10px] text-terminal-muted">
                  REPORT SLOT {n}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

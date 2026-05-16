import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  TrendingUp,
  Gauge,
  ArrowUpDown,
  AlertTriangle,
  FileText,
  Send,
  Loader2,
} from 'lucide-react'
import Card from '../components/Card'
import {
  sendResearchQuery,
  getMarketQuotes,
  getFearGreed,
  getTopMovers,
} from '../utils/api'
import FearGreedGauge from '../components/charts/FearGreedGauge'
import HeatmapChart from '../components/charts/HeatmapChart'
import PriceChart from '../components/charts/PriceChart'
import ResearchChart from '../components/charts/ResearchChart'

const REFRESH_MS = 60000

function formatApiError(err) {
  const parts = []

  if (err?.message) parts.push(`Message: ${err.message}`)
  if (err?.code) parts.push(`Code: ${err.code}`)
  if (err?.name) parts.push(`Name: ${err.name}`)

  if (err?.response) {
    parts.push(`Status: ${err.response.status} ${err.response.statusText || ''}`.trim())
    parts.push(`Response: ${JSON.stringify(err.response.data, null, 2)}`)
    parts.push(`URL: ${err.config?.baseURL || ''}${err.config?.url || ''}`)
  } else if (err?.request) {
    parts.push(
      'No response from server. Check that uvicorn is running at http://localhost:8000',
    )
    parts.push(
      `Request URL: ${err.config?.baseURL || 'http://localhost:8000'}${err.config?.url || ''}`,
    )
  }

  if (err?.stack) parts.push(`Stack:\n${err.stack}`)

  return parts.length > 0 ? parts.join('\n\n') : String(err)
}

function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
      <Loader2 className="h-6 w-6 animate-spin text-terminal-accent" />
      <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-muted">
        {label}
      </p>
    </div>
  )
}

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

function MarketOverviewContent({ quotes, loading, error }) {
  if (loading) return <LoadingSpinner label="Fetching quotes..." />
  if (error) {
    return (
      <p className="font-mono text-xs text-red-400">{error}</p>
    )
  }
  if (!quotes?.length) {
    return (
      <p className="font-mono text-xs text-terminal-muted">No quote data available</p>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      {quotes.map((q) => (
        <div
          key={q.symbol}
          className="flex items-center justify-between rounded border border-terminal-border/60 bg-terminal-bg/50 px-3 py-2"
        >
          <span className="font-mono text-xs font-semibold text-terminal-text">
            {q.symbol}
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs tabular-nums text-terminal-text">
              {q.price?.toLocaleString?.() ?? q.price}
            </span>
            <span
              className={`font-mono text-xs font-medium tabular-nums ${
                q.positive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {q.positive ? '+' : ''}
              {q.change_pct}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function FearGreedContent({ data, loading, error }) {
  if (loading) return <LoadingSpinner label="Calculating sentiment..." />
  if (error) {
    return <p className="font-mono text-xs text-red-400">{error}</p>
  }

  const score = data?.score ?? 50
  const label = data?.label ?? 'Neutral'
  const color = data?.color ?? '#eab308'

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-2">
      <p
        className="font-mono text-5xl font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold uppercase tracking-wider text-terminal-text">
        {label}
      </p>

      {/* Arc-style gauge via filled bar */}
      <div className="mt-6 w-full max-w-xs">
        <div className="h-3 overflow-hidden rounded-full bg-terminal-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-terminal-muted">
          <span>FEAR</span>
          <span>NEUTRAL</span>
          <span>GREED</span>
        </div>
      </div>

      {(data?.vix != null || data?.spy_return_3mo != null) && (
        <div className="mt-4 flex gap-4 font-mono text-[10px] text-terminal-muted">
          {data.vix != null && <span>VIX {data.vix}</span>}
          {data.spy_return_3mo != null && (
            <span>SPY 3M {data.spy_return_3mo > 0 ? '+' : ''}{data.spy_return_3mo}%</span>
          )}
        </div>
      )}
    </div>
  )
}

function TopMoversContent({ movers, loading, error }) {
  if (loading) return <LoadingSpinner label="Scanning movers..." />
  if (error) {
    return <p className="font-mono text-xs text-red-400">{error}</p>
  }

  const gainers = movers?.gainers ?? []
  const losers = movers?.losers ?? []

  const MoverRow = ({ item, positive }) => (
    <div className="flex items-center justify-between rounded border border-terminal-border/60 bg-terminal-bg/50 px-3 py-2">
      <span className="font-mono text-xs font-semibold text-terminal-text">
        {item.symbol}
      </span>
      <span
        className={`font-mono text-xs font-medium tabular-nums ${
          positive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {positive ? '+' : ''}
        {item.change_pct}%
      </span>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-400">
          Top Gainers
        </p>
        <div className="space-y-1.5">
          {gainers.length > 0 ? (
            gainers.map((q) => <MoverRow key={q.symbol} item={q} positive />)
          ) : (
            <p className="font-mono text-[10px] text-terminal-muted">No gainers</p>
          )}
        </div>
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400">
          Top Losers
        </p>
        <div className="space-y-1.5">
          {losers.length > 0 ? (
            losers.map((q) => <MoverRow key={q.symbol} item={q} positive={false} />)
          ) : (
            <p className="font-mono text-[10px] text-terminal-muted">No losers</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [quotes, setQuotes] = useState([])
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [quotesError, setQuotesError] = useState(null)

  const [fearGreed, setFearGreed] = useState(null)
  const [fearGreedLoading, setFearGreedLoading] = useState(true)
  const [fearGreedError, setFearGreedError] = useState(null)

  const [movers, setMovers] = useState(null)
  const [moversLoading, setMoversLoading] = useState(true)
  const [moversError, setMoversError] = useState(null)

  const [researchedSymbol, setResearchedSymbol] = useState(null)
  const [researchPriceData, setResearchPriceData] = useState(null)

  const loadQuotes = useCallback(async () => {
    setQuotesLoading(true)
    setQuotesError(null)
    try {
      const data = await getMarketQuotes()
      setQuotes(data.quotes ?? [])
    } catch (err) {
      setQuotesError(err.message || 'Failed to load quotes')
    } finally {
      setQuotesLoading(false)
    }
  }, [])

  const loadFearGreed = useCallback(async () => {
    setFearGreedLoading(true)
    setFearGreedError(null)
    try {
      const data = await getFearGreed()
      setFearGreed(data)
    } catch (err) {
      setFearGreedError(err.message || 'Failed to load fear & greed')
    } finally {
      setFearGreedLoading(false)
    }
  }, [])

  const loadMovers = useCallback(async () => {
    setMoversLoading(true)
    setMoversError(null)
    try {
      const data = await getTopMovers()
      setMovers(data)
    } catch (err) {
      setMoversError(err.message || 'Failed to load movers')
    } finally {
      setMoversLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuotes()
    loadFearGreed()
    loadMovers()

    const interval = setInterval(() => {
      loadQuotes()
      loadFearGreed()
      loadMovers()
    }, REFRESH_MS)

    return () => clearInterval(interval)
  }, [loadQuotes, loadFearGreed, loadMovers])

  async function handleSendQuery() {
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)
    setResearchedSymbol(null)
    setResearchPriceData(null)

    try {
      const data = await sendResearchQuery(trimmed)
      setResponse(data)
      
      // Extract symbol from response if available
      if (data?.symbol) {
        setResearchedSymbol(data.symbol)
      }
      
      // Extract price data if available
      if (data?.dates && data?.prices) {
        setResearchPriceData({
          dates: data.dates,
          prices: data.prices,
        })
      }
    } catch (err) {
      console.error('[AlphaLens] sendResearchQuery failed:', err)
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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
          INSTITUTIONAL QUANT RESEARCH · LIVE MARKET DATA
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
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
                scenarios powered by Groq LLM and live market data.
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
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400">
                    Request Error
                  </p>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-red-400">
                    {error}
                  </pre>
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

              {researchedSymbol && (
                <div className="rounded-md border border-terminal-border bg-terminal-bg p-4">
                  <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-accent">
                    Price Chart
                  </p>
                  <PriceChart symbol={researchedSymbol} period="1y" />
                </div>
              )}

              {researchPriceData && researchedSymbol && (
                <div className="rounded-md border border-terminal-border bg-terminal-bg p-4">
                  <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-accent">
                    Research Chart
                  </p>
                  <ResearchChart
                    dates={researchPriceData.dates}
                    prices={researchPriceData.prices}
                    symbol={researchedSymbol}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card
          title="Market Overview"
          subtitle="Cross-asset snapshot"
          className="xl:col-span-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-terminal-accent" />
            <span className="font-mono text-[10px] text-terminal-muted">
              MAJOR INDICES · FX · CRYPTO
            </span>
          </div>
          <HeatmapChart />
        </Card>

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

        <Card
          title="Top Movers"
          subtitle="Gainers & losers"
          className="xl:col-span-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-terminal-accent" />
          </div>
          <TopMoversContent
            movers={movers}
            loading={moversLoading}
            error={moversError}
          />
        </Card>

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

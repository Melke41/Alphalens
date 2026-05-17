import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  Gauge,
  ArrowUpDown,
  AlertTriangle,
  Calendar,
  Loader2,
  Radio,
} from 'lucide-react'
import Card from '../components/Card'
import FearGreedGauge from '../components/charts/FearGreedGauge'
import AnimatedNumber from '../components/AnimatedNumber'
import AiCopilot from '../components/AiCopilot'
import {
  getMarketQuotes,
  getFearGreed,
  getTopMovers,
  getMacroDashboard,
  safeApiCall,
} from '../utils/api'
import { REFRESH_INTERVAL_5MIN, delay } from '../utils/refreshIntervals'

const WATCHLIST = ['SPY', 'QQQ', 'BTC-USD', 'GLD', 'NVDA', 'TSLA']

const UPCOMING_EVENTS = [
  { name: 'Next FOMC Meeting', date: 'Jun 17–18, 2026' },
  { name: 'Next CPI Release', date: 'Jun 11, 2026' },
  { name: 'Next Jobs Report', date: 'Jun 5, 2026' },
  { name: 'Next GDP Release', date: 'May 29, 2026' },
]


function buildMacroAlerts(dashboard) {
  if (!dashboard) return []
  const alerts = []

  if (dashboard.real_rate < 0) {
    alerts.push({
      type: 'caution',
      text: '⚠️ Negative Real Rates — Inflationary environment',
    })
  }
  if (dashboard.yield_curve?.inverted) {
    alerts.push({
      type: 'warning',
      text: '🚨 Yield Curve Inverted — Recession risk elevated',
    })
  }
  if (dashboard.inflation?.current > 3) {
    alerts.push({
      type: 'caution',
      text: '📈 Inflation above Fed target — Watch for rate hikes',
    })
  }
  if (dashboard.fed_funds_rate?.current > 5) {
    alerts.push({
      type: 'info',
      text: '🏦 Fed Funds Rate at decade high — Risk assets under pressure',
    })
  }

  return alerts
}

const borderByType = {
  warning: 'border-l-red-500',
  caution: 'border-l-orange-500',
  info: 'border-l-blue-500',
}

function FadeCard({ index, children, className = '' }) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {children}
    </div>
  )
}

function QuoteCard({ quote }) {
  const positive = quote.positive
  return (
    <div className="dashboard-card rounded-lg border border-terminal-border bg-terminal-surface p-4">
      <p className="font-mono text-xs font-semibold text-terminal-muted">{quote.symbol}</p>
      <p className="mt-2 font-mono text-2xl font-bold text-terminal-text">
        {quote.price != null ? (
          <AnimatedNumber value={quote.price} decimals={2} prefix="$" />
        ) : (
          '—'
        )}
      </p>
      <p
        className={`mt-1 font-mono text-sm font-semibold ${
          positive ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {quote.change_pct != null
          ? `${positive ? '+' : ''}${quote.change_pct}%`
          : '—'}
      </p>
    </div>
  )
}

function LoadingBlock({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12">
      <Loader2 className="h-6 w-6 animate-spin text-terminal-accent" />
      <span className="font-mono text-xs text-terminal-muted">{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const [quotes, setQuotes] = useState([])
  const [quotesLoading, setQuotesLoading] = useState(true)

  const [fearGreed, setFearGreed] = useState(null)
  const [fearGreedLoading, setFearGreedLoading] = useState(true)

  const [movers, setMovers] = useState(null)
  const [moversLoading, setMoversLoading] = useState(true)

  const [macro, setMacro] = useState(null)
  const [macroLoading, setMacroLoading] = useState(true)

  const loadAllMarketData = useCallback(async () => {
    setQuotesLoading(true)
    setFearGreedLoading(true)
    setMoversLoading(true)
    setMacroLoading(true)

    const quotesData = await safeApiCall(() => getMarketQuotes())
    if (quotesData) setQuotes(quotesData.quotes ?? [])

    await delay(2000)

    const fearData = await safeApiCall(() => getFearGreed())
    if (fearData) setFearGreed(fearData)

    await delay(2000)

    const moversData = await safeApiCall(() => getTopMovers())
    if (moversData) setMovers(moversData)

    await delay(2000)

    const macroData = await safeApiCall(() => getMacroDashboard())
    if (macroData) setMacro(macroData)

    setQuotesLoading(false)
    setFearGreedLoading(false)
    setMoversLoading(false)
    setMacroLoading(false)
  }, [])

  useEffect(() => {
    loadAllMarketData()
    const intervalId = setInterval(loadAllMarketData, REFRESH_INTERVAL_5MIN)
    return () => clearInterval(intervalId)
  }, [loadAllMarketData])

  const watchlistQuotes = useMemo(() => {
    const map = Object.fromEntries(quotes.map((q) => [q.symbol, q]))
    return WATCHLIST.map((sym) => map[sym] || { symbol: sym, price: null, change_pct: null })
  }, [quotes])

  const macroAlerts = useMemo(() => buildMacroAlerts(macro), [macro])
  const gainers = movers?.gainers ?? []
  const losers = movers?.losers ?? []

  return (
    <div className="space-y-6 pb-24">
      <FadeCard index={0}>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-terminal-border pb-4">
          <div>
            <p className="mb-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
              <Radio className="h-3 w-3 text-terminal-accent live-indicator-pulse" />
              Command Center
            </p>
            <h1 className="font-mono text-2xl font-bold tracking-tight text-terminal-text">
              Dashboard
            </h1>
          </div>
          <p className="font-mono text-xs text-terminal-muted">
            INSTITUTIONAL QUANT RESEARCH · LIVE MARKET DATA
          </p>
        </div>
      </FadeCard>

      {/* Row 1: Market Overview */}
      <FadeCard index={1}>
        <Card
          title="Market Overview"
          subtitle="Live watchlist"
          className="dashboard-card"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-terminal-accent" />
            <span className="font-mono text-[10px] text-terminal-muted">
              SPY · QQQ · BTC · GLD · NVDA · TSLA
            </span>
          </div>
          {quotesLoading ? (
            <LoadingBlock label="Fetching live quotes..." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {watchlistQuotes.map((q) => (
                <QuoteCard key={q.symbol} quote={q} />
              ))}
            </div>
          )}
        </Card>
      </FadeCard>

      {/* Row 2: Fear & Greed + Movers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FadeCard index={2}>
          <Card title="Fear & Greed Index" subtitle="Market sentiment" className="dashboard-card h-full">
            <Gauge className="mb-2 h-4 w-4 text-terminal-accent" />
            <FearGreedGauge data={fearGreed} loading={fearGreedLoading} disablePolling />
          </Card>
        </FadeCard>

        <FadeCard index={3}>
          <Card title="Top Gainers & Losers" subtitle="Today's movers" className="dashboard-card h-full">
            <ArrowUpDown className="mb-3 h-4 w-4 text-terminal-accent" />
            {moversLoading ? (
              <LoadingBlock label="Scanning movers..." />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-green-400">
                    Top Gainers
                  </p>
                  <div className="space-y-2">
                    {gainers.length > 0 ? (
                      gainers.map((item) => (
                        <div
                          key={item.symbol}
                          className="flex justify-between rounded border border-terminal-border/60 bg-terminal-bg/50 px-3 py-2"
                        >
                          <span className="font-mono text-xs font-semibold">{item.symbol}</span>
                          <span className="font-mono text-xs text-green-400">
                            +{item.change_pct}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="font-mono text-[10px] text-terminal-muted">No gainers</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400">
                    Top Losers
                  </p>
                  <div className="space-y-2">
                    {losers.length > 0 ? (
                      losers.map((item) => (
                        <div
                          key={item.symbol}
                          className="flex justify-between rounded border border-terminal-border/60 bg-terminal-bg/50 px-3 py-2"
                        >
                          <span className="font-mono text-xs font-semibold">{item.symbol}</span>
                          <span className="font-mono text-xs text-red-400">{item.change_pct}%</span>
                        </div>
                      ))
                    ) : (
                      <p className="font-mono text-[10px] text-terminal-muted">No losers</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </FadeCard>
      </div>

      {/* Row 3: Macro Alerts + Calendar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FadeCard index={4}>
          <Card title="Macro Alerts" subtitle="Fed · CPI · yields" className="dashboard-card h-full">
            <AlertTriangle className="mb-3 h-4 w-4 text-amber-400" />
            {macroLoading ? (
              <LoadingBlock label="Loading macro intelligence..." />
            ) : macroAlerts.length > 0 ? (
              <div className="space-y-3">
                {macroAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`border-l-4 bg-terminal-bg/50 py-2.5 pl-3 pr-2 font-mono text-xs leading-relaxed text-terminal-text ${borderByType[alert.type]}`}
                  >
                    {alert.text}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-terminal-muted">
                No active macro alerts. Conditions within normal ranges.
              </p>
            )}
          </Card>
        </FadeCard>

        <FadeCard index={5}>
          <Card title="Event Calendar" subtitle="Upcoming releases" className="dashboard-card h-full">
            <Calendar className="mb-3 h-4 w-4 text-terminal-accent" />
            <div className="space-y-2">
              {UPCOMING_EVENTS.map((event) => (
                <div
                  key={event.name}
                  className="flex items-center justify-between rounded border border-terminal-border/60 bg-terminal-bg/50 px-3 py-2.5"
                >
                  <span className="font-mono text-xs text-terminal-text">{event.name}</span>
                  <span className="font-mono text-[10px] text-terminal-muted">{event.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </FadeCard>
      </div>

      <AiCopilot />
    </div>
  )
}


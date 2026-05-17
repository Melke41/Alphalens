import { useState, useEffect } from 'react'
import { LineChart, Search, TrendingUp, ArrowUpDown, Loader2 } from 'lucide-react'
import Card from '../components/Card'
import PriceChart from '../components/charts/PriceChart'
import HeatmapChart from '../components/charts/HeatmapChart'
import { getMarketQuotes, getTopMovers, safeApiCall } from '../utils/api'
import { ApiCooldownError } from '../utils/apiCooldown'
import { REFRESH_INTERVAL_5MIN, delay } from '../utils/refreshIntervals'

function TickerTape({ quotes }) {
  const tickerSymbols = ['SPY', 'QQQ', 'BTC-USD', 'GLD']
  const tickerQuotes = quotes?.filter((q) => tickerSymbols.includes(q.symbol)) || []

  if (!tickerQuotes.length) return null

  return (
    <div className="overflow-hidden border-b border-terminal-border bg-terminal-bg">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...tickerQuotes, ...tickerQuotes, ...tickerQuotes].map((quote, i) => (
          <div key={`${quote.symbol}-${i}`} className="flex items-center gap-2 px-6 py-2">
            <span className="font-mono text-xs font-semibold text-terminal-text">
              {quote.symbol}
            </span>
            <span className="font-mono text-xs text-terminal-text">
              {quote.price?.toFixed(2)}
            </span>
            <span
              className={`font-mono text-xs font-medium ${
                quote.positive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {quote.positive ? '+' : ''}
              {quote.change_pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopMoversSection({ movers, loading, error }) {
  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-terminal-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="font-mono text-xs text-red-400">{error}</p>
    )
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

export default function Markets() {
  const [searchSymbol, setSearchSymbol] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState('SPY')

  const [quotes, setQuotes] = useState([])
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [quotesError, setQuotesError] = useState(null)

  const [movers, setMovers] = useState(null)
  const [moversLoading, setMoversLoading] = useState(true)
  const [moversError, setMoversError] = useState(null)

  useEffect(() => {
    const loadMarketData = async () => {
      setQuotesLoading(true)
      setMoversLoading(true)
      setQuotesError(null)
      setMoversError(null)

      try {
        const quotesData = await safeApiCall(() => getMarketQuotes())
        if (quotesData) setQuotes(quotesData.quotes ?? [])

        await delay(2000)

        const moversData = await safeApiCall(() => getTopMovers())
        if (moversData) setMovers(moversData)
      } catch (err) {
        if (!(err instanceof ApiCooldownError)) {
          setQuotesError(err.message || 'Failed to load market data')
        }
      } finally {
        setQuotesLoading(false)
        setMoversLoading(false)
      }
    }

    loadMarketData()

    const intervalId = setInterval(loadMarketData, REFRESH_INTERVAL_5MIN)
    return () => clearInterval(intervalId)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchSymbol.trim()) {
      setSelectedSymbol(searchSymbol.trim().toUpperCase())
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-terminal-border pb-4">
        <div>
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
            Market Intelligence
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-terminal-text">
            Markets
          </h1>
        </div>
        <p className="hidden font-mono text-xs text-terminal-muted sm:block">
          LIVE MARKET DATA · CROSS-ASSET INTELLIGENCE
        </p>
      </div>

      <TickerTape quotes={quotes} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card
          title="Symbol Search"
          subtitle="Enter any ticker symbol"
          className="xl:col-span-12"
        >
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-terminal-muted" />
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                placeholder="e.g. AAPL, BTC-USD, GLD..."
                className="w-full rounded-md border border-terminal-border bg-terminal-bg px-10 py-2.5 font-mono text-sm text-terminal-text outline-none transition-colors placeholder:text-terminal-muted/60 focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-md border border-terminal-accent/40 bg-terminal-accent/10 px-4 py-2.5 font-mono text-sm font-medium text-terminal-accent transition-colors hover:bg-terminal-accent/20"
            >
              Search
            </button>
          </form>
        </Card>

        <Card
          title="Price Chart"
          subtitle={`Candlestick chart for ${selectedSymbol}`}
          className="xl:col-span-8"
        >
          <PriceChart symbol={selectedSymbol} period="1y" />
        </Card>

        <Card
          title="Top Movers"
          subtitle="Gainers & losers"
          className="xl:col-span-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-terminal-accent" />
          </div>
          <TopMoversSection
            movers={movers}
            loading={moversLoading}
            error={moversError}
          />
        </Card>

        <Card
          title="Global Heatmap"
          subtitle="Market performance overview"
          className="xl:col-span-12"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-terminal-accent" />
            <span className="font-mono text-[10px] text-terminal-muted">
              REAL-TIME MARKET DATA
            </span>
          </div>
          <HeatmapChart />
        </Card>
      </div>
    </div>
  )
}

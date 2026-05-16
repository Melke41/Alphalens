import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { checkHealth, safeApiCall } from '../utils/api'
import { REFRESH_INTERVAL_3MIN } from '../utils/refreshIntervals'
import { isMarketOpen } from '../utils/marketHours'

function formatDateTime(date) {
  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/New_York',
    }),
  }
}

export default function Navbar() {
  const [now, setNow] = useState(() => new Date())
  const [marketOpen, setMarketOpen] = useState(() => isMarketOpen())
  const [backendConnected, setBackendConnected] = useState(false)

  useEffect(() => {
    const tick = setInterval(() => {
      const current = new Date()
      setNow(current)
      setMarketOpen(isMarketOpen(current))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    async function pollHealth() {
      const result = await safeApiCall(() => checkHealth())
      setBackendConnected(Boolean(result))
    }

    pollHealth()
    const intervalId = setInterval(pollHealth, REFRESH_INTERVAL_3MIN)
    return () => clearInterval(intervalId)
  }, [])

  const { date, time } = formatDateTime(now)

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-terminal-border bg-terminal-bg/95 px-6 backdrop-blur-sm">
      {/* Date & time */}
      <div className="flex shrink-0 items-center gap-4 font-mono text-xs">
        <div>
          <p className="text-terminal-muted">SESSION</p>
          <p className="font-medium text-terminal-text">{date}</p>
        </div>
        <div className="h-8 w-px bg-terminal-border" />
        <div>
          <p className="text-terminal-muted">ET</p>
          <p className="text-lg font-semibold tabular-nums tracking-wider text-terminal-accent">
            {time}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mx-auto w-full max-w-xl flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-terminal-muted"
          strokeWidth={1.75}
        />
        <input
          type="search"
          placeholder="Search tickers, macros, research, quant models..."
          className="w-full rounded-md border border-terminal-border bg-terminal-bg py-2.5 pl-10 pr-4 font-mono text-sm text-terminal-text outline-none transition-colors placeholder:text-terminal-muted/60 focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20"
          readOnly
          aria-label="Global search"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-terminal-border bg-terminal-elevated px-1.5 py-0.5 font-mono text-[10px] text-terminal-muted sm:inline">
          ⌘K
        </kbd>
      </div>

      {/* Backend connection */}
      <div
        className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs ${
          backendConnected
            ? 'border-terminal-accent/30 bg-terminal-accent/10 text-terminal-accent'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {backendConnected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terminal-accent opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              backendConnected
                ? 'bg-terminal-accent shadow-[0_0_8px_#3b82f6]'
                : 'bg-red-400 shadow-[0_0_8px_#f87171]'
            }`}
          />
        </span>
        <span className="font-bold tracking-wider">
          {backendConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>

      {/* Market status */}
      <div
        className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs ${
          marketOpen
            ? 'border-terminal-accent/30 bg-terminal-accent/10 text-terminal-accent'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            marketOpen
              ? 'bg-terminal-accent shadow-[0_0_8px_#3b82f6]'
              : 'bg-red-400 shadow-[0_0_8px_#f87171]'
          }`}
        />
        <span className="font-bold tracking-wider">
          {marketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
        </span>
      </div>
    </header>
  )
}

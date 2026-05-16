import { useState, useEffect } from 'react'
import { getHeatmap, safeApiCall } from '../../utils/api'
import { ApiCooldownError } from '../../utils/apiCooldown'
import { REFRESH_INTERVAL_5MIN } from '../../utils/refreshIntervals'
import { Loader2 } from 'lucide-react'

export default function HeatmapChart({
  data: externalData,
  loading: externalLoading,
  disablePolling = false,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!disablePolling)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (disablePolling) return

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await safeApiCall(() => getHeatmap())
        if (response) setData(response)
      } catch (err) {
        if (err instanceof ApiCooldownError) return
        setError(err.message || 'Failed to fetch heatmap data')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    const intervalId = setInterval(loadData, REFRESH_INTERVAL_5MIN)
    return () => clearInterval(intervalId)
  }, [disablePolling])

  const displayData = disablePolling ? externalData : data
  const displayLoading = disablePolling ? externalLoading : loading

  const getColor = (positive) => {
    return positive ? '#22c55e' : '#ef4444'
  }

  const getSize = (change) => {
    const absChange = Math.abs(change)
    const baseSize = 80
    const maxSize = 140
    const size = baseSize + (absChange / 5) * (maxSize - baseSize)
    return Math.min(size, maxSize)
  }

  if (displayLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-accent" />
      </div>
    )
  }

  if (error && !disablePolling) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="font-mono text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!displayData || !Array.isArray(displayData) || !displayData.length) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="font-mono text-sm text-terminal-muted">No heatmap data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {displayData.map((market) => (
        <div
          key={market.symbol}
          className="group relative flex flex-col items-center justify-center rounded-lg border border-terminal-border/60 bg-terminal-bg/50 p-3 transition-all hover:border-terminal-accent/40 hover:scale-105"
          style={{
            minHeight: `${getSize(market.change_pct)}px`,
            backgroundColor: `${getColor(market.positive)}15`,
          }}
        >
          <span className="font-mono text-xs font-semibold text-terminal-text">
            {market.symbol}
          </span>
          <span className="mt-1 font-mono text-sm font-bold text-terminal-text">
            {market.price?.toFixed(2)}
          </span>
          <span
            className={`mt-1 font-mono text-xs font-medium ${
              market.positive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {market.change_pct >= 0 ? '+' : ''}
            {market.change_pct.toFixed(2)}%
          </span>

          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-terminal-bg/95 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="font-mono text-xs font-semibold text-terminal-text">
              {market.name || market.symbol}
            </span>
            <span className="mt-1 font-mono text-sm text-terminal-text">
              {market.price?.toFixed(2)}
            </span>
            <span className="mt-1 font-mono text-xs text-terminal-muted">
              Volume: {market.volume?.toLocaleString() || 'N/A'}
            </span>
            <span
              className={`mt-1 font-mono text-sm font-bold ${
                market.positive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {market.change_pct >= 0 ? '+' : ''}
              {market.change_pct.toFixed(2)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

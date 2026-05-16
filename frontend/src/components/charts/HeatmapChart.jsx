import { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2 } from 'lucide-react'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default function HeatmapChart() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get('/market/heatmap')
        console.log("Heatmap data:", response.data)
        setData(response.data)
      } catch (err) {
        console.error("Error fetching heatmap data:", err)
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch heatmap data'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="font-mono text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!data || !Array.isArray(data) || !data.length) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="font-mono text-sm text-terminal-muted">No heatmap data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {data.map((market) => (
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

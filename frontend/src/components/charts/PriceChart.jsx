import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import api, { safeApiCall } from '../../utils/api'
import { ApiCooldownError } from '../../utils/apiCooldown'
import { Loader2 } from 'lucide-react'

function getPlotTheme() {
  if (typeof window === 'undefined') {
    return {
      surface: '#0a0a0a',
      grid: '#1f2937',
      font: '#9ca3af',
    }
  }
  const s = getComputedStyle(document.documentElement)
  const surface = s.getPropertyValue('--terminal-bg')?.trim() || '#0a0a0a'
  const surface2 = s.getPropertyValue('--terminal-surface')?.trim() || surface
  const grid = s.getPropertyValue('--terminal-border')?.trim() || '#1f2937'
  const font = s.getPropertyValue('--terminal-muted')?.trim() || '#9ca3af'
  return { surface, surface2, grid, font }
}

export default function PriceChart({ symbol, period = '1y' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  const periods = ['1M', '3M', '6M', '1Y', '2Y', '5Y']

  useEffect(() => {
    setSelectedPeriod(period)
  }, [period])

  useEffect(() => {
    if (!symbol) return

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await safeApiCall(() =>
          api.post('/market-data', {
            symbol: symbol,
            period: selectedPeriod.toLowerCase(),
          }),
        )
        if (response) setData(response.data.data)
      } catch (err) {
        if (err instanceof ApiCooldownError) return
        setError(err.response?.data?.detail || err.message || 'Failed to fetch market data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [symbol, selectedPeriod])

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

  if (!data || !data.dates || !data.dates.length) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="font-mono text-sm text-terminal-muted">No data available for {symbol}</p>
      </div>
    )
  }

  const latestPrice = data.close[data.close.length - 1]
  const latestChange = data.changes ? data.changes[data.changes.length - 1] : 0

  const candlestickTrace = {
    x: data.dates,
    open: data.open,
    high: data.high,
    low: data.low,
    close: data.close,
    type: 'candlestick',
    increasing: { line: { color: '#3b82f6' } },
    decreasing: { line: { color: '#ef4444' } },
    xaxis: 'x',
    yaxis: 'y',
  }

  const volumeTrace = {
    x: data.dates,
    y: data.volume || [],
    type: 'bar',
    marker: {
      color: data.volume?.map((_, i) => (data.close[i] >= data.open[i] ? '#3b82f6' : '#ef4444')),
    },
    xaxis: 'x',
    yaxis: 'y2',
  }

  const plotTheme = getPlotTheme()

  const layout = {
    paper_bgcolor: plotTheme.surface,
    plot_bgcolor: plotTheme.surface,
    font: { color: plotTheme.font, family: 'monospace' },
    margin: { t: 60, r: 50, b: 50, l: 60 },
    xaxis: {
      domain: [0, 1],
      gridcolor: plotTheme.grid,
      showgrid: true,
      zeroline: false,
      showspikes: true,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikethickness: 1,
      spikedash: 'solid',
      spikecolor: plotTheme.font,
    },
    yaxis: {
      domain: [0.25, 1],
      gridcolor: plotTheme.grid,
      showgrid: true,
      zeroline: false,
      showspikes: true,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikethickness: 1,
      spikedash: 'solid',
      spikecolor: plotTheme.font,
    },
    yaxis2: {
      domain: [0, 0.2],
      gridcolor: plotTheme.grid,
      showgrid: true,
      zeroline: false,
      showticklabels: false,
    },
    showlegend: false,
    dragmode: 'pan',
  }

  const config = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: true,
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-mono text-xl font-bold text-terminal-text">{symbol}</h3>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-terminal-text">${latestPrice?.toFixed(2)}</span>
            <span
              className={`font-mono text-sm font-medium ${latestChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {latestChange >= 0 ? '+' : ''}
              {latestChange?.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p.toLowerCase())}
              className={`px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                selectedPeriod.toLowerCase() === p.toLowerCase()
                  ? 'bg-terminal-accent text-terminal-text'
                  : 'bg-terminal-bg text-terminal-muted hover:bg-terminal-border'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <Plot data={[candlestickTrace, volumeTrace]} layout={layout} config={config} style={{ width: '100%', height: '400px' }} useResizeHandler />
    </div>
  )
}

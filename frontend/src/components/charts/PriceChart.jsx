import { useState, useEffect, useRef } from 'react'
import Plot from 'react-plotly.js'
import api, { safeApiCall } from '../../utils/api'
import { ApiCooldownError } from '../../utils/apiCooldown'
import { Loader2, Maximize2, Minimize2, Plus, Minus, RotateCcw } from 'lucide-react'

function formatVolume(vol) {
  if (!vol) return '0'
  if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`
  if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`
  return vol.toFixed(0)
}

export default function PriceChart({ symbol, period = '1y', height = 500 }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [chartType, setChartType] = useState('candlestick')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCrosshair, setShowCrosshair] = useState(true)
  const plotRef = useRef(null)

  const periods = ['1D', '5D', '1M', '3M', '6M', '1Y', '2Y', '5Y']
  const chartTypes = ['Candles', 'Line', 'Area']

  // Zoom functions
  const handleZoomIn = () => {
    if (!plotRef.current) return
    const currentLayout = plotRef.current.layout
    const xaxis = currentLayout.xaxis || {}
    const currentRange = xaxis.range || [data.dates[0], data.dates[data.dates.length - 1]]
    
    const rangeSize = new Date(currentRange[1]) - new Date(currentRange[0])
    const newRangeSize = rangeSize * 0.8
    const center = new Date(currentRange[0]) + rangeSize / 2
    
    const newStart = new Date(center - newRangeSize / 2).toISOString().split('T')[0]
    const newEnd = new Date(center + newRangeSize / 2).toISOString().split('T')[0]
    
    plotRef.current.relayout({ 'xaxis.range': [newStart, newEnd] })
  }

  const handleZoomOut = () => {
    if (!plotRef.current) return
    const currentLayout = plotRef.current.layout
    const xaxis = currentLayout.xaxis || {}
    const currentRange = xaxis.range || [data.dates[0], data.dates[data.dates.length - 1]]
    
    const rangeSize = new Date(currentRange[1]) - new Date(currentRange[0])
    const newRangeSize = rangeSize * 1.2
    const center = new Date(currentRange[0]) + rangeSize / 2
    
    const newStart = new Date(center - newRangeSize / 2).toISOString().split('T')[0]
    const newEnd = new Date(center + newRangeSize / 2).toISOString().split('T')[0]
    
    plotRef.current.relayout({ 'xaxis.range': [newStart, newEnd] })
  }

  const handleResetZoom = () => {
    if (!plotRef.current) return
    plotRef.current.relayout({ 'xaxis.range': [data.dates[0], data.dates[data.dates.length - 1]] })
  }

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
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-accent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <p className="font-mono text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!data || !data.dates || !data.dates.length) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <p className="font-mono text-sm text-terminal-muted">No data available for {symbol}</p>
      </div>
    )
  }

  const latestPrice = data.close[data.close.length - 1]
  const latestChange = data.changes ? data.changes[data.changes.length - 1] : 0

  // Build traces based on chart type
  let traces = []

  if (chartType === 'candlestick') {
    traces.push({
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
      name: 'Price',
    })
  } else if (chartType === 'line') {
    traces.push({
      x: data.dates,
      y: data.close,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#3b82f6', width: 2 },
      xaxis: 'x',
      yaxis: 'y',
      name: 'Price',
    })
  } else if (chartType === 'area') {
    traces.push({
      x: data.dates,
      y: data.close,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#3b82f6', width: 2 },
      fill: 'tozeroy',
      fillcolor: 'rgba(59, 130, 246, 0.2)',
      xaxis: 'x',
      yaxis: 'y',
      name: 'Price',
    })
  }

  // Volume trace
  traces.push({
    x: data.dates,
    y: data.volume || [],
    type: 'bar',
    marker: {
      color: data.volume?.map((_, i) => (data.close[i] >= data.open[i] ? '#3b82f6' : '#ef4444')),
    },
    xaxis: 'x',
    yaxis: 'y2',
    name: 'Volume',
  })

  // Custom hover template
  const hoverTemplate = chartType === 'candlestick'
    ? '<b>%{x}</b><br>' +
      'O: %{open:.2f}<br>' +
      'H: %{high:.2f}<br>' +
      'L: %{low:.2f}<br>' +
      'C: %{close:.2f}<br>' +
      'Vol: %{customdata[0]}<extra></extra>'
    : '<b>%{x}</b><br>' +
      'Price: %{y:.2f}<br>' +
      'Vol: %{customdata[0]}<extra></extra>'

  // Add customdata for volume formatting
  traces[0].customdata = data.volume?.map(v => [formatVolume(v)])
  traces[1].customdata = data.volume?.map(v => [formatVolume(v)])

  const layout = {
    paper_bgcolor: '#0a0a0a',
    plot_bgcolor: '#0a0a0a',
    font: { color: '#9ca3af', family: 'monospace', size: 11 },
    margin: { t: 10, r: 60, b: 60, l: 10 },
    xaxis: {
      domain: [0, 1],
      gridcolor: '#1f2937',
      showgrid: true,
      zeroline: false,
      showspikes: showCrosshair,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikethickness: 1,
      spikedash: 'solid',
      spikecolor: '#6b7280',
      tickfont: { color: '#9ca3af', family: 'monospace', size: 10 },
    },
    yaxis: {
      domain: [0.2, 1],
      gridcolor: '#1f2937',
      showgrid: true,
      zeroline: false,
      showspikes: showCrosshair,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikethickness: 1,
      spikedash: 'solid',
      spikecolor: '#6b7280',
      side: 'right',
      tickfont: { color: '#9ca3af', family: 'monospace', size: 10 },
    },
    yaxis2: {
      domain: [0, 0.18],
      gridcolor: '#1f2937',
      showgrid: false,
      zeroline: false,
      showticklabels: true,
      tickfont: { color: '#9ca3af', family: 'monospace', size: 9 },
      title: { text: 'Volume', font: { color: '#9ca3af', family: 'monospace', size: 10 } },
    },
    showlegend: false,
    dragmode: 'pan',
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#1f2937',
      bordercolor: '#3b82f6',
      font: { color: '#f3f4f6', family: 'monospace', size: 11 },
    },
  }

  const config = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: true,
    doubleClick: 'reset',
  }

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-terminal-bg' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-terminal-border bg-terminal-bg px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-mono text-lg font-bold text-terminal-text">{symbol}</h3>
            <div className="mt-0.5 flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-terminal-text">${latestPrice?.toFixed(2)}</span>
              <span
                className={`font-mono text-sm font-medium ${latestChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {latestChange >= 0 ? '+' : ''}
                {latestChange?.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Period buttons */}
          <div className="flex gap-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p.toLowerCase())}
                className={`px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                  selectedPeriod.toLowerCase() === p.toLowerCase()
                    ? 'bg-blue-600 text-white'
                    : 'bg-terminal-bg text-terminal-muted hover:bg-terminal-border'
                }`}>
                {p}
              </button>
            ))}
          </div>
          {/* Chart type toggle */}
          <div className="ml-4 flex gap-1 border-l border-terminal-border pl-4">
            {chartTypes.map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type.toLowerCase())}
                className={`px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                  chartType === type.toLowerCase()
                    ? 'bg-blue-600 text-white'
                    : 'bg-terminal-bg text-terminal-muted hover:bg-terminal-border'
                }`}>
                {type}
              </button>
            ))}
          </div>
          {/* Zoom controls */}
          <div className="ml-4 flex gap-1 border-l border-terminal-border pl-4">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-terminal-border text-terminal-muted hover:text-terminal-text transition-colors"
              title="Zoom In">
              <Plus size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-terminal-border text-terminal-muted hover:text-terminal-text transition-colors"
              title="Zoom Out">
              <Minus size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded hover:bg-terminal-border text-terminal-muted hover:text-terminal-text transition-colors"
              title="Reset Zoom">
              <RotateCcw size={16} />
            </button>
          </div>
          {/* Crosshair toggle */}
          <div className="ml-4 flex gap-1 border-l border-terminal-border pl-4">
            <button
              onClick={() => setShowCrosshair(!showCrosshair)}
              className={`px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                showCrosshair
                  ? 'bg-blue-600 text-white'
                  : 'bg-terminal-bg text-terminal-muted hover:bg-terminal-border'
              }`}
              title="Toggle Crosshair">
              Crosshair
            </button>
          </div>
          {/* Fullscreen button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="ml-4 p-1.5 rounded hover:bg-terminal-border text-terminal-muted hover:text-terminal-text transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      {/* Chart */}
      <Plot
        ref={plotRef}
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height: isFullscreen ? '90vh' : `${height}px` }}
        useResizeHandler
      />
    </div>
  )
}

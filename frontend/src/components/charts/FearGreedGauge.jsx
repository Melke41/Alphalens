import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { getFearGreed, safeApiCall } from '../../utils/api'
import { ApiCooldownError } from '../../utils/apiCooldown'
import { REFRESH_INTERVAL_5MIN } from '../../utils/refreshIntervals'
import { Loader2 } from 'lucide-react'

export default function FearGreedGauge({
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
        const response = await safeApiCall(() => getFearGreed())
        if (response) setData(response)
      } catch (err) {
        if (err instanceof ApiCooldownError) return
        setError(err.message || 'Failed to fetch fear & greed data')
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

  if (displayLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-accent" />
      </div>
    )
  }

  if (error && !disablePolling) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="font-mono text-sm text-red-400">{error}</p>
      </div>
    )
  }

  const score = displayData?.score ?? 50

  const getLabel = (value) => {
    if (value <= 25) return 'Extreme Fear'
    if (value <= 45) return 'Fear'
    if (value <= 55) return 'Neutral'
    if (value <= 75) return 'Greed'
    return 'Extreme Greed'
  }

  const getColor = (value) => {
    if (value <= 25) return '#ef4444'
    if (value <= 45) return '#f97316'
    if (value <= 55) return '#eab308'
    if (value <= 75) return '#22c55e'
    return '#3b82f6'
  }

  const currentLabel = getLabel(score)
  const currentColor = getColor(score)

  const trace = {
    domain: { x: [0, 1], y: [0, 1] },
    value: score,
    title: { text: '' },
    type: 'indicator',
    mode: 'gauge+number',
    delta: { reference: 50 },
    gauge: {
      axis: { range: [0, 100], visible: false },
      shape: 'angular',
      bgcolor: '#0a0a0a',
      bar: {
        color: currentColor,
        line: { color: currentColor, width: 2 },
        thickness: 0.8,
      },
      steps: [
        { range: [0, 25], color: 'rgba(239, 68, 68, 0.1)' },
        { range: [25, 45], color: 'rgba(249, 115, 22, 0.1)' },
        { range: [45, 55], color: 'rgba(234, 179, 8, 0.1)' },
        { range: [55, 75], color: 'rgba(34, 197, 94, 0.1)' },
        { range: [75, 100], color: 'rgba(59, 130, 246, 0.1)' },
      ],
      threshold: {
        line: { color: currentColor, width: 4 },
        thickness: 0.75,
        value: score,
      },
    },
    number: {
      font: {
        size: 48,
        family: 'monospace',
        color: '#ffffff',
      },
      valueformat: '.0f',
    },
  }

  const layout = {
    paper_bgcolor: '#0a0a0a',
    plot_bgcolor: '#0a0a0a',
    font: { color: '#9ca3af', family: 'monospace' },
    margin: { t: 0, r: 0, b: 0, l: 0 },
    height: 250,
    showlegend: false,
  }

  const config = {
    responsive: true,
    displayModeBar: false,
  }

  return (
    <div className="flex flex-col items-center">
      <Plot
        data={[trace]}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '250px' }}
        useResizeHandler
      />
      <p
        className="mt-[-20px] font-mono text-sm font-semibold uppercase tracking-wider"
        style={{ color: currentColor }}
      >
        {currentLabel}
      </p>
    </div>
  )
}

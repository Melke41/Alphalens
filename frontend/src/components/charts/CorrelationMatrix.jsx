import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { fetchMarketData } from '../../utils/api'
import { Loader2 } from 'lucide-react'

const DEFAULT_ASSETS = ['SPY', 'BTC-USD', 'GLD', 'QQQ', 'TLT', 'USO']

export default function CorrelationMatrix({ assets = DEFAULT_ASSETS }) {
  const [correlationData, setCorrelationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCorrelationData = async () => {
      setLoading(true)
      setError(null)
      try {
        const assetData = await Promise.all(
          assets.map((asset) => fetchMarketData(asset, '1y'))
        )

        const priceArrays = assetData.map((data) => data.prices || [])
        const validAssets = assets.filter((_, i) => priceArrays[i]?.length > 0)

        if (validAssets.length < 2) {
          throw new Error('Need at least 2 assets with data')
        }

        const validPrices = priceArrays.filter((p) => p?.length > 0)
        const minLength = Math.min(...validPrices.map((p) => p.length))

        const trimmedPrices = validPrices.map((prices) =>
          prices.slice(-minLength)
        )

        const correlationMatrix = []
        for (let i = 0; i < validAssets.length; i++) {
          correlationMatrix[i] = []
          for (let j = 0; j < validAssets.length; j++) {
            correlationMatrix[i][j] = calculateCorrelation(
              trimmedPrices[i],
              trimmedPrices[j]
            )
          }
        }

        setCorrelationData({
          matrix: correlationMatrix,
          assets: validAssets,
        })
      } catch (err) {
        setError(err.message || 'Failed to calculate correlations')
      } finally {
        setLoading(false)
      }
    }

    loadCorrelationData()
  }, [assets])

  const calculateCorrelation = (x, y) => {
    const n = x.length
    if (n === 0) return 0

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0)
    const sumX2 = x.reduce((a, xi) => a + xi * xi, 0)
    const sumY2 = y.reduce((a, yi) => a + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    )

    if (denominator === 0) return 0
    return numerator / denominator
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

  if (!correlationData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="font-mono text-sm text-terminal-muted">No correlation data available</p>
      </div>
    )
  }

  const { matrix, assets: validAssets } = correlationData

  const trace = {
    z: matrix,
    x: validAssets,
    y: validAssets,
    type: 'heatmap',
    colorscale: [
      [0, '#ef4444'],
      [0.5, '#ffffff'],
      [1, '#3b82f6'],
    ],
    showscale: true,
    colorbar: {
      title: 'Correlation',
      titlefont: { color: '#9ca3af', family: 'monospace' },
      tickfont: { color: '#9ca3af', family: 'monospace' },
    },
    text: matrix.map((row) =>
      row.map((val) => val.toFixed(2))
    ),
    texttemplate: '%{text}',
    textfont: {
      color: '#0a0a0a',
      family: 'monospace',
      size: 12,
    },
    hovertemplate: '<b>%{x}</b> vs <b>%{y}</b><br>Correlation: %{z:.2f}<extra></extra>',
  }

  const layout = {
    paper_bgcolor: '#0a0a0a',
    plot_bgcolor: '#0a0a0a',
    font: { color: '#9ca3af', family: 'monospace' },
    margin: { t: 50, r: 50, b: 80, l: 80 },
    xaxis: {
      side: 'bottom',
      tickfont: { color: '#9ca3af', family: 'monospace', size: 11 },
    },
    yaxis: {
      side: 'left',
      tickfont: { color: '#9ca3af', family: 'monospace', size: 11 },
    },
    showlegend: false,
  }

  const config = {
    responsive: true,
    displayModeBar: false,
  }

  return (
    <Plot
      data={[trace]}
      layout={layout}
      config={config}
      style={{ width: '100%', height: '400px' }}
      useResizeHandler
    />
  )
}

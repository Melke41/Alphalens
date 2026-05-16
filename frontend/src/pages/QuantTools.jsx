import { useState } from 'react'
import axios from 'axios'
import Plot from 'react-plotly.js'

const PERIODS = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
]

function getValueColor(key, value) {
  switch (key) {
    case 'total_return':
    case 'alpha':
      return value >= 0 ? '#4ade80' : '#f87171'
    case 'sharpe_ratio':
    case 'sortino_ratio':
    case 'calmar_ratio':
      return value >= 1 ? '#4ade80' : value >= 0 ? '#facc15' : '#f87171'
    case 'max_drawdown':
      return value > -0.1 ? '#4ade80' : value > -0.2 ? '#facc15' : '#f87171'
    case 'var_95':
    case 'cvar_95':
      return value > -0.02 ? '#4ade80' : value > -0.04 ? '#facc15' : '#f87171'
    case 'beta':
      return value >= 0.8 && value <= 1.2 ? '#60a5fa' : value < 0.8 ? '#4ade80' : '#f87171'
    case 'win_rate':
      return value >= 50 ? '#4ade80' : '#f87171'
    case 'profit_factor':
      return value >= 1 ? '#4ade80' : '#f87171'
    default:
      return '#ffffff'
  }
}

function formatValue(key, value) {
  if (value === null || value === undefined) return 'N/A'
  switch (key) {
    case 'latest_price':
      return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'total_return':
    case 'win_rate':
      return `${value}%`
    case 'max_drawdown':
    case 'var_95':
    case 'cvar_95':
      return `${(value * 100).toFixed(2)}%`
    default:
      return String(value)
  }
}

export default function QuantTools() {
  const [symbol, setSymbol] = useState('AAPL')
  const [symbol2, setSymbol2] = useState('SPY')
  const [period, setPeriod] = useState('1y')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleRunAnalysis() {
    if (!symbol.trim()) return
    setLoading(true)
    setResults(null)
    try {
      const res = await axios.post('http://localhost:8000/calculate', {
        type: 'full_analysis',
        symbol: symbol.trim().toUpperCase(),
        symbol2: symbol2.trim().toUpperCase(),
        period,
      })
      setResults(res.data)
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const metrics = results
    ? [
        { key: 'latest_price', label: 'Latest Price', value: results.latest_price },
        { key: 'total_return', label: 'Total Return %', value: results.total_return },
        { key: 'volatility', label: 'Volatility', value: results.volatility },
        { key: 'sharpe_ratio', label: 'Sharpe Ratio', value: results.sharpe_ratio },
        { key: 'sortino_ratio', label: 'Sortino Ratio', value: results.sortino_ratio },
        { key: 'max_drawdown', label: 'Max Drawdown %', value: results.max_drawdown },
        { key: 'var_95', label: 'VaR 95%', value: results.var_95 },
        { key: 'cvar_95', label: 'CVaR 95%', value: results.cvar_95 },
        { key: 'beta', label: 'Beta', value: results.beta },
        { key: 'alpha', label: 'Alpha', value: results.alpha },
        { key: 'win_rate', label: 'Win Rate %', value: results.win_rate },
        { key: 'profit_factor', label: 'Profit Factor', value: results.profit_factor },
        { key: 'calmar_ratio', label: 'Calmar Ratio', value: results.calmar_ratio },
        {
          key: 'correlation',
          label: 'Correlation',
          value: results.correlation?.correlation,
          extra: `p=${results.correlation?.p_value} \u00b7 ${results.correlation?.significant ? 'Significant' : 'Not Significant'} \u00b7 ${results.correlation?.interpretation}`,
        },
      ]
    : []

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', margin: 0 }}>
          Quant Tools
        </h1>
        <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>
          Institutional-Grade Risk &amp; Performance Analytics
        </p>
      </div>

      {/* 2. Asset Analyzer */}
      <div
        style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: '#9ca3af',
                fontFamily: 'monospace',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Primary Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderRadius: 6,
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: '#9ca3af',
                fontFamily: 'monospace',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Benchmark Symbol
            </label>
            <input
              type="text"
              value={symbol2}
              onChange={(e) => setSymbol2(e.target.value)}
              placeholder="SPY"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderRadius: 6,
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: period === p.value ? '1px solid #3b82f6' : '1px solid #1f2937',
                background: period === p.value ? 'rgba(59,130,246,0.15)' : '#0d1117',
                color: period === p.value ? '#3b82f6' : '#9ca3af',
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Run Analysis button */}
        <button
          onClick={handleRunAnalysis}
          disabled={loading || !symbol.trim()}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 6,
            border: '1px solid #3b82f6',
            background: 'rgba(59,130,246,0.15)',
            color: '#3b82f6',
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Running institutional analysis...' : 'Run Analysis'}
        </button>
      </div>

      {/* 3. Results Grid */}
      {results && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {metrics.map((m) => (
            <div
              key={m.key}
              style={{
                background: '#111827',
                border: '1px solid #1f2937',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: '#9ca3af',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  margin: 0,
                }}
              >
                {m.label}
              </p>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: getValueColor(m.key, m.value),
                  fontFamily: 'monospace',
                  margin: '8px 0 0 0',
                }}
              >
                {formatValue(m.key, m.value)}
              </p>
              {m.extra && (
                <p
                  style={{
                    fontSize: 10,
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    margin: '4px 0 0 0',
                  }}
                >
                  {m.extra}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. Z-Score Chart */}
      {results && results.zscore && results.dates && (
        <div
          style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 8,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 16px 0',
            }}
          >
            Price Anomaly Detection
          </h2>
          <Plot
            data={[
              {
                x: results.dates,
                y: results.zscore,
                type: 'scatter',
                mode: 'lines',
                name: 'Z-Score',
                line: { color: '#3b82f6', width: 1.5 },
              },
            ]}
            layout={{
              autosize: true,
              height: 350,
              margin: { l: 50, r: 30, t: 10, b: 50 },
              paper_bgcolor: '#111827',
              plot_bgcolor: '#111827',
              font: { color: '#9ca3af', family: 'monospace', size: 11 },
              xaxis: {
                gridcolor: '#1f2937',
                linecolor: '#1f2937',
                tickfont: { color: '#6b7280' },
              },
              yaxis: {
                gridcolor: '#1f2937',
                linecolor: '#1f2937',
                tickfont: { color: '#6b7280' },
                title: { text: 'Z-Score', font: { size: 11, color: '#9ca3af' } },
              },
              shapes: [
                {
                  type: 'line',
                  x0: results.dates[0],
                  x1: results.dates[results.dates.length - 1],
                  y0: 2,
                  y1: 2,
                  line: { color: '#ef4444', width: 1, dash: 'dash' },
                },
                {
                  type: 'line',
                  x0: results.dates[0],
                  x1: results.dates[results.dates.length - 1],
                  y0: -2,
                  y1: -2,
                  line: { color: '#ef4444', width: 1, dash: 'dash' },
                },
                {
                  type: 'line',
                  x0: results.dates[0],
                  x1: results.dates[results.dates.length - 1],
                  y0: 0,
                  y1: 0,
                  line: { color: '#6b7280', width: 1 },
                },
              ],
              showlegend: false,
            }}
            config={{ responsive: true, displayModeBar: false }}
            useResizeHandler
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  )
}

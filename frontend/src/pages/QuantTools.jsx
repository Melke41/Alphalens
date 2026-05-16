import { useState, useMemo } from 'react'
import { Calculator, Loader2, Info, TrendingUp, BarChart3, Activity } from 'lucide-react'
import Plot from 'react-plotly.js'
import Card from '../components/Card'
import { runFullAnalysis } from '../utils/api'

const PERIODS = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
]

const METRIC_TOOLTIPS = {
  latest_price: 'Most recent closing price of the asset.',
  total_return: 'Percentage return over the entire selected period.',
  volatility: 'Annualized standard deviation of daily returns. Measures price uncertainty.',
  sharpe_ratio: 'Risk-adjusted return. Excess return per unit of total risk. >1 Good, >2 Excellent, >3 Legendary.',
  sortino_ratio: 'Like Sharpe but only penalizes downside volatility. Higher is better.',
  max_drawdown: 'Largest peak-to-trough decline. Measures worst-case loss scenario.',
  var_95: 'Value at Risk at 95% confidence. Maximum expected daily loss 95% of the time.',
  cvar_95: 'Conditional VaR. Average loss in the worst 5% of scenarios.',
  beta: 'Sensitivity to benchmark moves. Beta=1 means moves with market, <1 less volatile, >1 more volatile.',
  alpha: 'Excess return above what CAPM predicts. Positive alpha = outperformance.',
  win_rate: 'Percentage of days with positive returns.',
  profit_factor: 'Ratio of gross profits to gross losses. >1 means profitable overall.',
  calmar_ratio: 'Annualized return divided by max drawdown. Higher = better risk-adjusted performance.',
  correlation: 'Pearson correlation with benchmark. Measures how closely asset tracks the benchmark.',
}

function getMetricColor(key, value) {
  switch (key) {
    case 'total_return':
    case 'alpha':
      return value >= 0 ? 'text-green-400' : 'text-red-400'
    case 'sharpe_ratio':
    case 'sortino_ratio':
    case 'calmar_ratio':
      return value >= 1 ? 'text-green-400' : value >= 0 ? 'text-yellow-400' : 'text-red-400'
    case 'max_drawdown':
      return value > -0.1 ? 'text-green-400' : value > -0.2 ? 'text-yellow-400' : 'text-red-400'
    case 'var_95':
    case 'cvar_95':
      return value > -0.02 ? 'text-green-400' : value > -0.04 ? 'text-yellow-400' : 'text-red-400'
    case 'beta':
      return value >= 0.8 && value <= 1.2 ? 'text-blue-400' : value < 0.8 ? 'text-green-400' : 'text-red-400'
    case 'win_rate':
      return value >= 50 ? 'text-green-400' : 'text-red-400'
    case 'profit_factor':
      return value >= 1 ? 'text-green-400' : 'text-red-400'
    default:
      return 'text-white'
  }
}

function formatMetricValue(key, value) {
  if (value === null || value === undefined) return 'N/A'
  switch (key) {
    case 'latest_price':
      return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'total_return':
    case 'win_rate':
      return `${value}%`
    case 'max_drawdown':
      return `${(value * 100).toFixed(2)}%`
    case 'var_95':
    case 'cvar_95':
      return `${(value * 100).toFixed(2)}%`
    default:
      return String(value)
  }
}

function MetricCard({ label, metricKey, value, sublabel }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltip = METRIC_TOOLTIPS[metricKey]
  const colorClass = getMetricColor(metricKey, value)
  const displayValue = formatMetricValue(metricKey, value)

  return (
    <div className="relative flex flex-col gap-1 rounded-lg border border-terminal-border bg-terminal-surface p-4 transition-colors hover:border-terminal-accent/30">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">
          {label}
        </span>
        {tooltip && (
          <button
            type="button"
            className="text-terminal-muted/50 transition-colors hover:text-terminal-accent"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <Info size={12} />
          </button>
        )}
      </div>
      <span className={`font-mono text-xl font-bold tabular-nums ${colorClass}`}>
        {displayValue}
      </span>
      {sublabel && (
        <span className="font-mono text-[10px] text-terminal-muted">{sublabel}</span>
      )}
      {showTooltip && tooltip && (
        <div className="absolute -top-1 left-0 z-50 w-64 -translate-y-full rounded-md border border-terminal-border bg-terminal-elevated p-3 shadow-lg">
          <p className="font-mono text-[11px] leading-relaxed text-terminal-text">{tooltip}</p>
        </div>
      )}
    </div>
  )
}

function generateSignals(strategy, prices, returns, zscore) {
  const len = prices.length
  const signals = new Array(len).fill(0)

  if (strategy === 'buy_hold') {
    signals.fill(1)
  } else if (strategy === 'momentum') {
    for (let i = 20; i < len; i++) {
      const window = returns.slice(i - 20, i)
      const avgReturn = window.reduce((a, b) => a + b, 0) / window.length
      signals[i] = avgReturn > 0 ? 1 : 0
    }
  } else if (strategy === 'mean_reversion') {
    for (let i = 0; i < len; i++) {
      signals[i] = zscore[i] < -2 ? 1 : zscore[i] > 2 ? -1 : 0
    }
  }

  return signals
}

export default function QuantTools() {
  const [symbol, setSymbol] = useState('AAPL')
  const [symbol2, setSymbol2] = useState('SPY')
  const [period, setPeriod] = useState('1y')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const [backtestStrategy, setBacktestStrategy] = useState('momentum')
  const [backtestResults, setBacktestResults] = useState(null)
  const [backtestLoading, setBacktestLoading] = useState(false)

  async function handleRunAnalysis() {
    if (!symbol.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    setBacktestResults(null)
    try {
      const data = await runFullAnalysis(symbol.trim().toUpperCase(), symbol2.trim().toUpperCase(), period)
      if (data.error) {
        setError(data.error)
      } else {
        setResults(data)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  function handleRunBacktest() {
    if (!results) return
    setBacktestLoading(true)

    setTimeout(() => {
      const signals = generateSignals(
        backtestStrategy,
        results.prices,
        results.returns,
        results.zscore
      )

      const prices = results.prices
      const returns = prices.map((p, i) => i === 0 ? 0 : (p - prices[i - 1]) / prices[i - 1])
      const stratReturns = returns.map((r, i) => i === 0 ? 0 : r * (signals[i - 1] || 0))
      let cumulative = [1]
      for (let i = 1; i < stratReturns.length; i++) {
        cumulative.push(cumulative[i - 1] * (1 + stratReturns[i]))
      }

      const totalReturn = ((cumulative[cumulative.length - 1] - 1) * 100).toFixed(2)
      const nonZero = stratReturns.filter(r => r !== 0)
      const wins = nonZero.filter(r => r > 0).length
      const winRate = nonZero.length > 0 ? ((wins / nonZero.length) * 100).toFixed(2) : '0.00'

      const grossProfit = nonZero.filter(r => r > 0).reduce((a, b) => a + b, 0)
      const grossLoss = Math.abs(nonZero.filter(r => r < 0).reduce((a, b) => a + b, 0))
      const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(4) : '0'

      let peak = cumulative[0]
      let maxDD = 0
      for (const val of cumulative) {
        if (val > peak) peak = val
        const dd = (val - peak) / peak
        if (dd < maxDD) maxDD = dd
      }

      const mean = nonZero.reduce((a, b) => a + b, 0) / (nonZero.length || 1)
      const annReturn = mean * 252
      const variance = nonZero.reduce((a, b) => a + (b - mean) ** 2, 0) / (nonZero.length || 1)
      const annVol = Math.sqrt(variance) * Math.sqrt(252)
      const sharpe = annVol !== 0 ? ((annReturn - 0.05) / annVol).toFixed(4) : '0'

      setBacktestResults({
        equity_curve: cumulative,
        total_return: totalReturn,
        sharpe: sharpe,
        max_drawdown: (maxDD * 100).toFixed(2),
        win_rate: winRate,
        profit_factor: profitFactor,
        dates: results.dates,
      })
      setBacktestLoading(false)
    }, 100)
  }

  const zscorechart = useMemo(() => {
    if (!results?.zscore || !results?.dates) return null
    const zscore = results.zscore
    const dates = results.dates

    const overboughtX = []
    const overboughtY = []
    const oversoldX = []
    const oversoldY = []
    const normalX = []
    const normalY = []

    for (let i = 0; i < zscore.length; i++) {
      if (zscore[i] > 2) {
        overboughtX.push(dates[i])
        overboughtY.push(zscore[i])
      } else if (zscore[i] < -2) {
        oversoldX.push(dates[i])
        oversoldY.push(zscore[i])
      } else {
        normalX.push(dates[i])
        normalY.push(zscore[i])
      }
    }

    return { overboughtX, overboughtY, oversoldX, oversoldY, normalX, normalY, dates, zscore }
  }, [results])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-terminal-border pb-4">
        <div>
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
            Quantitative Analytics
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
            Quant Tools
          </h1>
          <p className="mt-1 font-mono text-xs text-terminal-muted">
            Institutional-Grade Risk & Performance Analytics
          </p>
        </div>
        <Calculator className="h-6 w-6 text-terminal-accent" />
      </div>

      {/* Section 1: Asset Analyzer */}
      <Card title="Asset Analyzer" subtitle="Run full quantitative analysis" accent="QUANT">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">
                Primary Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. AAPL"
                className="w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-sm text-terminal-text outline-none transition-colors placeholder:text-terminal-muted/60 focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">
                Benchmark Symbol
              </label>
              <input
                type="text"
                value={symbol2}
                onChange={(e) => setSymbol2(e.target.value)}
                placeholder="e.g. SPY"
                className="w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-sm text-terminal-text outline-none transition-colors placeholder:text-terminal-muted/60 focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">
                Period
              </label>
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`flex-1 rounded-md border px-2 py-2 font-mono text-xs font-medium transition-colors ${
                      period === p.value
                        ? 'border-terminal-accent bg-terminal-accent/20 text-terminal-accent'
                        : 'border-terminal-border bg-terminal-bg text-terminal-muted hover:border-terminal-accent/30 hover:text-terminal-text'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={loading || !symbol.trim()}
            className="flex items-center justify-center gap-2 rounded-md border border-terminal-accent/40 bg-terminal-accent/10 px-6 py-2.5 font-mono text-sm font-semibold text-terminal-accent transition-colors hover:bg-terminal-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running institutional analysis...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Run Analysis
              </>
            )}
          </button>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
              <p className="font-mono text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Section 2: Results Dashboard */}
      {results && (
        <Card title="Results Dashboard" subtitle={`${results.symbol} · ${results.period}`} accent="METRICS">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <MetricCard label="Latest Price" metricKey="latest_price" value={results.latest_price} />
            <MetricCard label="Total Return" metricKey="total_return" value={results.total_return} />
            <MetricCard label="Annualized Volatility" metricKey="volatility" value={results.volatility} />
            <MetricCard
              label="Sharpe Ratio"
              metricKey="sharpe_ratio"
              value={results.sharpe_ratio}
              sublabel={
                results.sharpe_ratio >= 3 ? 'Legendary' :
                results.sharpe_ratio >= 2 ? 'Excellent' :
                results.sharpe_ratio >= 1 ? 'Good' : ''
              }
            />
            <MetricCard label="Sortino Ratio" metricKey="sortino_ratio" value={results.sortino_ratio} />
            <MetricCard label="Max Drawdown" metricKey="max_drawdown" value={results.max_drawdown} />
            <MetricCard label="VaR 95%" metricKey="var_95" value={results.var_95} />
            <MetricCard label="CVaR 95%" metricKey="cvar_95" value={results.cvar_95} />
            <MetricCard label="Beta vs Benchmark" metricKey="beta" value={results.beta} />
            <MetricCard label="Alpha vs Benchmark" metricKey="alpha" value={results.alpha} />
            <MetricCard label="Win Rate" metricKey="win_rate" value={results.win_rate} />
            <MetricCard label="Profit Factor" metricKey="profit_factor" value={results.profit_factor} />
            <MetricCard label="Calmar Ratio" metricKey="calmar_ratio" value={results.calmar_ratio} />
            <MetricCard
              label="Correlation"
              metricKey="correlation"
              value={results.correlation?.correlation}
              sublabel={`p=${results.correlation?.p_value} · ${results.correlation?.significant ? 'Significant' : 'Not Significant'} · ${results.correlation?.interpretation}`}
            />
          </div>
        </Card>
      )}

      {/* Section 3: Z-Score Anomaly Detector */}
      {results && zscorechart && (
        <Card title="Price Anomaly Detection" subtitle="Z-Score anomaly zones" accent="Z-SCORE">
          <div className="w-full">
            <Plot
              data={[
                {
                  x: zscorechart.dates,
                  y: zscorechart.zscore,
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Z-Score',
                  line: { color: '#3b82f6', width: 1.5 },
                },
                {
                  x: zscorechart.overboughtX,
                  y: zscorechart.overboughtY,
                  type: 'scatter',
                  mode: 'markers',
                  name: 'Overbought (>+2)',
                  marker: { color: '#ef4444', size: 5 },
                },
                {
                  x: zscorechart.oversoldX,
                  y: zscorechart.oversoldY,
                  type: 'scatter',
                  mode: 'markers',
                  name: 'Oversold (<-2)',
                  marker: { color: '#3b82f6', size: 5 },
                },
              ]}
              layout={{
                autosize: true,
                height: 350,
                margin: { l: 50, r: 30, t: 30, b: 50 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#9ca3af', family: 'JetBrains Mono, monospace', size: 10 },
                xaxis: {
                  gridcolor: '#1f1f1f',
                  linecolor: '#1f1f1f',
                  tickfont: { size: 9 },
                },
                yaxis: {
                  gridcolor: '#1f1f1f',
                  linecolor: '#1f1f1f',
                  tickfont: { size: 9 },
                  title: { text: 'Z-Score', font: { size: 10 } },
                },
                shapes: [
                  { type: 'line', x0: zscorechart.dates[0], x1: zscorechart.dates[zscorechart.dates.length - 1], y0: 2, y1: 2, line: { color: '#ef4444', width: 1, dash: 'dash' } },
                  { type: 'line', x0: zscorechart.dates[0], x1: zscorechart.dates[zscorechart.dates.length - 1], y0: -2, y1: -2, line: { color: '#ef4444', width: 1, dash: 'dash' } },
                  { type: 'line', x0: zscorechart.dates[0], x1: zscorechart.dates[zscorechart.dates.length - 1], y0: 0, y1: 0, line: { color: '#6b7280', width: 1, dash: 'dot' } },
                  {
                    type: 'rect',
                    x0: zscorechart.dates[0], x1: zscorechart.dates[zscorechart.dates.length - 1],
                    y0: 2, y1: Math.max(4, Math.max(...zscorechart.zscore) + 0.5),
                    fillcolor: 'rgba(239, 68, 68, 0.05)',
                    line: { width: 0 },
                  },
                  {
                    type: 'rect',
                    x0: zscorechart.dates[0], x1: zscorechart.dates[zscorechart.dates.length - 1],
                    y0: Math.min(-4, Math.min(...zscorechart.zscore) - 0.5), y1: -2,
                    fillcolor: 'rgba(59, 130, 246, 0.05)',
                    line: { width: 0 },
                  },
                ],
                annotations: [
                  { x: zscorechart.dates[zscorechart.dates.length - 1], y: 2.2, text: 'OVERBOUGHT', showarrow: false, font: { color: '#ef4444', size: 9 } },
                  { x: zscorechart.dates[zscorechart.dates.length - 1], y: -2.2, text: 'OVERSOLD', showarrow: false, font: { color: '#3b82f6', size: 9 } },
                ],
                legend: {
                  orientation: 'h',
                  x: 0.5,
                  xanchor: 'center',
                  y: -0.15,
                  font: { size: 9 },
                },
                showlegend: true,
              }}
              config={{ responsive: true, displayModeBar: false }}
              useResizeHandler
              className="w-full"
            />
          </div>
        </Card>
      )}

      {/* Section 4: Backtester */}
      {results && (
        <Card title="Strategy Backtester" subtitle="Test trading strategies" accent="BACKTEST">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-48">
                <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">
                  Strategy
                </label>
                <select
                  value={backtestStrategy}
                  onChange={(e) => setBacktestStrategy(e.target.value)}
                  className="w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-sm text-terminal-text outline-none transition-colors focus:border-terminal-accent/50 focus:ring-1 focus:ring-terminal-accent/20"
                >
                  <option value="momentum">Momentum (20-day trend)</option>
                  <option value="mean_reversion">Mean Reversion (Z-score {'<'} -2)</option>
                  <option value="buy_hold">Buy and Hold</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleRunBacktest}
                disabled={backtestLoading}
                className="flex items-center gap-2 rounded-md border border-terminal-accent/40 bg-terminal-accent/10 px-6 py-2 font-mono text-sm font-semibold text-terminal-accent transition-colors hover:bg-terminal-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {backtestLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Run Backtest
                  </>
                )}
              </button>
            </div>

            {backtestResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">Total Return</p>
                    <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${Number(backtestResults.total_return) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {backtestResults.total_return}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">Sharpe Ratio</p>
                    <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${Number(backtestResults.sharpe) >= 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {backtestResults.sharpe}
                    </p>
                  </div>
                  <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">Max Drawdown</p>
                    <p className="mt-1 font-mono text-lg font-bold tabular-nums text-red-400">
                      {backtestResults.max_drawdown}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">Win Rate</p>
                    <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${Number(backtestResults.win_rate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {backtestResults.win_rate}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-terminal-muted">Profit Factor</p>
                    <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${Number(backtestResults.profit_factor) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {backtestResults.profit_factor}
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <Plot
                    data={[
                      {
                        x: backtestResults.dates,
                        y: backtestResults.equity_curve,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Equity Curve',
                        line: { color: '#3b82f6', width: 2 },
                        fill: 'tozeroy',
                        fillcolor: 'rgba(59, 130, 246, 0.08)',
                      },
                      {
                        x: backtestResults.dates,
                        y: new Array(backtestResults.dates.length).fill(1),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Baseline',
                        line: { color: '#6b7280', width: 1, dash: 'dash' },
                      },
                    ]}
                    layout={{
                      autosize: true,
                      height: 300,
                      margin: { l: 50, r: 30, t: 30, b: 50 },
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      font: { color: '#9ca3af', family: 'JetBrains Mono, monospace', size: 10 },
                      xaxis: {
                        gridcolor: '#1f1f1f',
                        linecolor: '#1f1f1f',
                        tickfont: { size: 9 },
                      },
                      yaxis: {
                        gridcolor: '#1f1f1f',
                        linecolor: '#1f1f1f',
                        tickfont: { size: 9 },
                        title: { text: 'Portfolio Value', font: { size: 10 } },
                      },
                      legend: {
                        orientation: 'h',
                        x: 0.5,
                        xanchor: 'center',
                        y: -0.15,
                        font: { size: 9 },
                      },
                      showlegend: true,
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    useResizeHandler
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

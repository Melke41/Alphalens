import { useState } from 'react';

const PERIODS = ['1M', '3M', '6M', '1Y', '2Y', '5Y'];

function MetricCard({ name, value, subtext, good }) {
  const valueColor = good === true ? 'text-green-400' : good === false ? 'text-red-400' : 'text-terminal-text';
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 flex flex-col">
      <span className="text-xs text-terminal-muted font-mono uppercase tracking-wide mb-2">{name}</span>
      <span className={`text-2xl font-bold font-mono ${valueColor}`}>{value ?? '—'}</span>
      {subtext && <span className="text-xs text-terminal-muted mt-1">{subtext}</span>}
    </div>
  );
}

export default function QuantTools() {
  const [primarySymbol, setPrimarySymbol] = useState('AAPL');
  const [benchmarkSymbol, setBenchmarkSymbol] = useState('SPY');
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    if (!primarySymbol) { setError('Please enter a primary symbol'); return; }
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      const response = await fetch('https://alphalens-backend-23p4.onrender.com/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'full_analysis',
          symbol: primarySymbol.toUpperCase(),
          symbol2: benchmarkSymbol.toUpperCase() || 'SPY',
          period: selectedPeriod.toLowerCase(),
        }),
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val, suffix = '', decimals = 2) => {
    if (val === null || val === undefined) return '—';
    return `${parseFloat(val).toFixed(decimals)}${suffix}`;
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text p-6 md:p-10 font-mono">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-terminal-text mb-2">Quant Tools</h1>
        <p className="text-terminal-muted text-lg">Institutional-Grade Risk & Performance Analytics</p>
      </header>

      {/* Asset Analyzer */}
      <section className="bg-terminal-surface border border-terminal-border rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-terminal-text mb-6">Asset Analyzer</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-terminal-muted mb-2">Primary Symbol</label>
            <input
              type="text"
              value={primarySymbol}
              onChange={(e) => setPrimarySymbol(e.target.value.toUpperCase())}
              placeholder="AAPL"
              className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-4 py-3 text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-terminal-muted mb-2">Benchmark Symbol</label>
            <input
              type="text"
              value={benchmarkSymbol}
              onChange={(e) => setBenchmarkSymbol(e.target.value.toUpperCase())}
              placeholder="SPY"
              className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-4 py-3 text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent font-mono"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-terminal-muted mb-2">Analysis Period</label>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                  selectedPeriod === p
                    ? 'bg-terminal-accent text-terminal-text'
                    : 'bg-terminal-bg border border-terminal-border text-terminal-muted hover:border-terminal-accent hover:text-terminal-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="w-full md:w-auto px-8 py-3 bg-terminal-accent hover:bg-terminal-accent/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
        >
          {loading ? 'Running institutional analysis...' : 'Run Analysis'}
        </button>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </section>

      {/* Results Grid */}
      {results && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-terminal-text mb-6">Analysis Results — {results.symbol}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard name="Latest Price" value={`$${fmt(results.latest_price)}`} />
            <MetricCard name="Total Return" value={fmt(results.total_return, '%')} good={results.total_return > 0} />
            <MetricCard name="Volatility" value={fmt(results.volatility * 100, '%')} good={results.volatility < 0.2} />
            <MetricCard name="Sharpe Ratio" value={fmt(results.sharpe_ratio, '', 3)} good={results.sharpe_ratio > 1} subtext={results.sharpe_ratio > 2 ? 'Excellent' : results.sharpe_ratio > 1 ? 'Good' : ''} />
            <MetricCard name="Sortino Ratio" value={fmt(results.sortino_ratio, '', 3)} good={results.sortino_ratio > 1} />
            <MetricCard name="Max Drawdown" value={fmt(results.max_drawdown * 100, '%')} good={results.max_drawdown > -0.2} />
            <MetricCard name="VaR 95%" value={fmt(results.var_95 * 100, '%')} />
            <MetricCard name="CVaR 95%" value={fmt(results.cvar_95 * 100, '%')} />
            <MetricCard name="Beta" value={fmt(results.beta, '', 3)} subtext="vs benchmark" />
            <MetricCard name="Alpha" value={fmt(results.alpha * 100, '%', 3)} good={results.alpha > 0} />
            <MetricCard name="Win Rate" value={fmt(results.win_rate, '%')} good={results.win_rate > 50} />
            <MetricCard name="Profit Factor" value={fmt(results.profit_factor, '', 3)} good={results.profit_factor > 1.5} />
            <MetricCard name="Calmar Ratio" value={fmt(results.calmar_ratio, '', 3)} good={results.calmar_ratio > 1} />
            <MetricCard
              name="Correlation"
              value={fmt(results.correlation?.correlation, '', 3)}
              subtext={`p-value: ${fmt(results.correlation?.p_value, '', 4)} ${results.correlation?.significant ? '✓ Significant' : '✗ Not significant'}`}
            />
          </div>
        </section>
      )}

      {/* Z-Score Anomaly Detection */}
      {results && results.zscore && (
        <section className="bg-terminal-surface border border-terminal-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-terminal-text mb-2">Price Anomaly Detection</h2>
          <p className="text-terminal-muted text-sm mb-6">Z-Score — signals above +2 or below -2 indicate anomalies</p>
          <div className="w-full overflow-x-auto">
            <div className="h-64 flex items-end gap-px">
              {results.zscore.slice(-100).map((z, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 rounded-sm transition-all"
                  style={{
                    height: `${Math.min(Math.abs(z) * 20, 100)}%`,
                    backgroundColor: z > 2 ? '#ef4444' : z < -2 ? '#3b82f6' : z > 0 ? '#1d4ed8' : '#1e3a5f',
                    opacity: 0.8,
                  }}
                  title={`Z-Score: ${z.toFixed(2)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-terminal-muted mt-2">
              <span>100 days ago</span>
              <span className="text-red-400">Red = Overbought (&gt;+2σ)</span>
              <span className="text-blue-400">Blue = Oversold (&lt;-2σ)</span>
              <span>Today</span>
            </div>
          </div>
        </section>
      )}

      {!results && !loading && (
        <section className="bg-terminal-surface border border-terminal-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-terminal-text mb-2">Z-Score Anomaly Detection</h2>
          <div className="h-64 flex items-center justify-center border border-terminal-border rounded-lg bg-terminal-bg">
            <p className="text-terminal-muted">Run analysis to see anomaly detection chart</p>
          </div>
        </section>
      )}
    </div>
  );
}

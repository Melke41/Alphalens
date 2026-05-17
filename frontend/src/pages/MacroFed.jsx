import { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

export default function MacroFed() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fedQuery, setFedQuery] = useState('');
  const [fedAnalysis, setFedAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('https://alphalens-backend-23p4.onrender.com/macro/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching macro dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFedImpact = async () => {
    if (!fedQuery.trim()) return;
    setAnalyzing(true);
    try {
      const response = await axios.post('https://alphalens-backend-23p4.onrender.com/research', {
        query: fedQuery
      });
      setFedAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing Fed impact:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderTrendArrow = (current, previous) => {
    if (current > previous) return <span className="text-green-400">↑</span>;
    if (current < previous) return <span className="text-red-400">↓</span>;
    return <span className="text-gray-400">→</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading Macro & Fed Intelligence...</div>
      </div>
    );
  }

  const yieldCurve = dashboard?.yield_curve || {};
  const inverted = yieldCurve.inverted;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Macro & Fed Intelligence</h1>
          <p className="text-[#6b7280] text-lg">Central Bank Policy · Economic Indicators · Yield Curve</p>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Fed Funds Rate"
            value={dashboard?.fed_funds_rate?.current?.toFixed(2)}
            unit="%"
            trend={renderTrendArrow(dashboard?.fed_funds_rate?.current, dashboard?.fed_funds_rate?.previous)}
          />
          <MetricCard
            title="Inflation (CPI)"
            value={dashboard?.inflation?.current?.toFixed(2)}
            unit="%"
            trend={renderTrendArrow(dashboard?.inflation?.current, dashboard?.inflation?.previous)}
          />
          <MetricCard
            title="Unemployment"
            value={dashboard?.unemployment?.current?.toFixed(1)}
            unit="%"
            trend={renderTrendArrow(dashboard?.unemployment?.current, dashboard?.unemployment?.previous)}
          />
          <MetricCard
            title="Real Interest Rate"
            value={dashboard?.real_rate?.toFixed(2)}
            unit="%"
            color={dashboard?.real_rate > 0 ? 'text-green-400' : 'text-red-400'}
          />
        </div>

        {/* Yield Curve Section */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Yield Curve</h2>
          
          {inverted ? (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
              <span className="text-red-400 font-semibold">⚠️ YIELD CURVE INVERTED — Historical Recession Indicator</span>
            </div>
          ) : (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
              <span className="text-green-400 font-semibold">✅ Normal Yield Curve — Economic Expansion</span>
            </div>
          )}

          <div className="text-[#6b7280] mb-4">
            10Y-2Y Spread: <span className={inverted ? 'text-red-400' : 'text-green-400'}>{yieldCurve.spread_10_2?.toFixed(2)}%</span>
          </div>

          <Plot
            data={[
              {
                x: Object.keys(yieldCurve.yields || {}),
                y: Object.values(yieldCurve.yields || {}),
                type: 'bar',
                marker: {
                  color: inverted ? '#ef4444' : '#3b82f6'
                }
              }
            ]}
            layout={{
              paper_bgcolor: '#111827',
              plot_bgcolor: '#111827',
              font: { color: '#9ca3af' },
              xaxis: {
                title: 'Maturity',
                gridcolor: '#1f2937'
              },
              yaxis: {
                title: 'Yield %',
                gridcolor: '#1f2937'
              },
              margin: { t: 20, r: 20, b: 60, l: 60 }
            }}
            style={{ width: '100%', height: '300px' }}
            useResizeHandler={true}
          />
        </div>

        {/* Macro Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <TrendChart
            title="Fed Funds Rate"
            data={dashboard?.fed_funds_rate?.history}
            color="#3b82f6"
          />
          <TrendChart
            title="CPI Inflation"
            data={dashboard?.inflation?.history}
            color="#f97316"
          />
          <TrendChart
            title="Unemployment"
            data={dashboard?.unemployment?.history}
            color="#22c55e"
          />
        </div>

        {/* Fed Policy Analyzer Section */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Fed Policy Analyzer</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={fedQuery}
              onChange={(e) => setFedQuery(e.target.value)}
              placeholder="What happens to stocks if Fed cuts rates?"
              className="flex-1 bg-[#0a0a0a] border border-[#1f2937] rounded-lg px-4 py-3 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]"
            />
            <button
              onClick={analyzeFedImpact}
              disabled={analyzing || !fedQuery.trim()}
              className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1f2937] disabled:text-[#6b7280] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Fed Impact'}
            </button>
          </div>
          
          {fedAnalysis && (
            <div className="bg-[#0a0a0a] border border-[#1f2937] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
              <p className="text-[#9ca3af] whitespace-pre-wrap">{fedAnalysis.narrative}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, trend, color }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
      <div className="text-xs text-[#6b7280] font-mono uppercase tracking-wide mb-2">{title}</div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold font-mono ${color || 'text-white'}`}>
          {value ?? '—'}
        </span>
        <span className="text-[#6b7280]">{unit}</span>
        {trend && <span className="text-xl">{trend}</span>}
      </div>
    </div>
  );
}

function TrendChart({ title, data, color }) {
  if (!data || !data.dates || !data.values) {
    return (
      <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <div className="text-[#6b7280]">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <Plot
        data={[
          {
            x: data.dates,
            y: data.values,
            type: 'scatter',
            mode: 'lines',
            line: { color, width: 2 }
          }
        ]}
        layout={{
          paper_bgcolor: '#111827',
          plot_bgcolor: '#111827',
          font: { color: '#9ca3af', size: 10 },
          xaxis: {
            gridcolor: '#1f2937',
            tickfont: { size: 8 }
          },
          yaxis: {
            gridcolor: '#1f2937',
            tickfont: { size: 8 }
          },
          margin: { t: 10, r: 10, b: 40, l: 50 },
          showlegend: false
        }}
        style={{ width: '100%', height: '250px' }}
        useResizeHandler={true}
      />
    </div>
  );
}

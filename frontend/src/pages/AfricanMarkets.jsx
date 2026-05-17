import { useState, useEffect } from 'react'
import axios from 'axios'
import Plot from 'react-plotly.js'
import { sendResearchQuery } from '../utils/api'

function getPlotTheme() {
  if (typeof window === 'undefined') {
    return {
      surface: '#111827',
      grid: '#1f2937',
      font: '#9ca3af',
    }
  }
  const s = getComputedStyle(document.documentElement)
  const surface = s.getPropertyValue('--terminal-surface')?.trim() || '#111827'
  const grid = s.getPropertyValue('--terminal-border')?.trim() || '#1f2937'
  const font = s.getPropertyValue('--terminal-muted')?.trim() || '#9ca3af'
  return { surface, grid, font }
}

function StockCard({ item }) {
  if (!item.available) {
    return (
      <div className="bg-terminal-elevated opacity-75 border border-terminal-border rounded-xl p-5">
        <h3 className="text-terminal-text font-semibold mb-1">{item.name}</h3>
        <p className="text-xs text-[#6b7280] font-mono mb-3">{item.symbol}</p>
        <p className="text-sm text-[#9ca3af] font-medium">Data Unavailable</p>
        <p className="text-xs text-[#6b7280] mt-1">{item.note || 'No data'}</p>
      </div>
    )
  }

  const changeColor = item.positive ? 'text-green-400' : 'text-red-400'

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-xl p-5 hover:border-[#3b82f6]/40 transition-colors">
      <h3 className="text-terminal-text font-semibold mb-1">{item.name}</h3>
      <p className="text-xs text-[#6b7280] font-mono mb-4">{item.symbol}</p>
      <p className="text-2xl font-bold font-mono text-terminal-text mb-1">
        {item.price != null ? `$${item.price}` : '—'}
      </p>
      <p className={`text-sm font-mono font-semibold ${changeColor}`}>
        {item.change_pct != null ? `${item.change_pct >= 0 ? '+' : ''}${item.change_pct}%` : '—'}
      </p>
    </div>
  )
}

export default function AfricanMarkets() {
  const [markets, setMarkets] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [macro, setMacro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [researchQuery, setResearchQuery] = useState('')
  const [researchLoading, setResearchLoading] = useState(false)
  const [researchResult, setResearchResult] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [marketsRes, currenciesRes, macroRes] = await Promise.all([
          axios.get('https://alphalens-backend-23p4.onrender.com/african/markets'),
          axios.get('https://alphalens-backend-23p4.onrender.com/african/currencies'),
          axios.get('https://alphalens-backend-23p4.onrender.com/african/macro'),
        ])
        setMarkets(marketsRes.data)
        setCurrencies(currenciesRes.data)
        setMacro(macroRes.data)
      } catch (err) {
        console.error('Failed to load African markets data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const runResearch = async () => {
    const trimmed = researchQuery.trim()
    if (!trimmed) return
    setResearchLoading(true)
    setResearchResult(null)
    try {
      const data = await sendResearchQuery(trimmed)
      setResearchResult(data)
    } catch (err) {
      setResearchResult({
        narrative: err.response?.data?.detail || err.message || 'Research failed',
      })
    } finally {
      setResearchLoading(false)
    }
  }

  const gdpCountries = macro ? Object.keys(macro.gdp_growth || {}) : []
  const gdpValues = macro ? Object.values(macro.gdp_growth || {}) : []
  const inflationValues = macro ? Object.values(macro.inflation || {}) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-bg flex items-center justify-center font-mono">
        <p className="text-[#6b7280]">Loading African Markets...</p>
      </div>
    )
  }

  const plotTheme = getPlotTheme()

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text p-6 md:p-10 font-mono">
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-terminal-text mb-2">African Markets</h1>
        <p className="text-[#6b7280] text-lg mb-3">
          The Only Institutional Platform Covering African Financial Markets
        </p>
        <p className="text-2xl tracking-widest">🇪🇹 🇳🇬 🇰🇪 🇿🇦 🇪🇬 🇬🇭</p>
      </header>

      <div className="bg-[#3b82f6] rounded-xl px-6 py-4 mb-10 text-white text-sm md:text-base leading-relaxed">
        AlphaLens is the only quant platform with dedicated African market coverage — tracking 54
        economies across the continent in real time.
      </div>

      {/* Section 1: Stock Markets */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[#3b82f6] mb-6">African Stock Markets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {markets.map((item) => (
            <StockCard key={item.name} item={item} />
          ))}
        </div>
      </section>

      {/* Section 2: Currency Monitor */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[#3b82f6] mb-6">African Currency Monitor</h2>
        <div className="bg-terminal-surface border border-terminal-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-terminal-border bg-terminal-bg">
                <th className="text-left px-4 py-3 text-xs text-[#6b7280] uppercase tracking-wide">
                  Currency
                </th>
                <th className="text-right px-4 py-3 text-xs text-[#6b7280] uppercase tracking-wide">
                  USD Rate
                </th>
                <th className="text-right px-4 py-3 text-xs text-[#6b7280] uppercase tracking-wide">
                  Change %
                </th>
                <th className="text-right px-4 py-3 text-xs text-[#6b7280] uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((row) => (
                <tr key={row.name} className="border-b border-terminal-border last:border-0 hover:bg-terminal-bg/50">
                  <td className="px-4 py-3 text-terminal-text">{row.name}</td>
                  <td className="px-4 py-3 text-right text-terminal-text font-mono">
                    {row.available && row.usd_rate != null ? (
                      <span>
                        {row.usd_rate}
                        <span className="text-[#6b7280] text-xs ml-1">vs USD</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold ${
                      !row.available
                        ? 'text-[#6b7280]'
                        : row.positive
                          ? 'text-green-400'
                          : 'text-red-400'
                    }`}
                  >
                    {row.available && row.change_pct != null
                      ? `${row.change_pct >= 0 ? '+' : ''}${row.change_pct}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        row.available
                          ? 'bg-green-400/10 text-green-400'
                          : 'bg-terminal-border/50 text-[#9ca3af]'
                      }`}
                    >
                      {row.available ? 'Live' : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Macro Charts */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-terminal-text mb-2">African Economic Indicators 2024</h2>
        {macro?.source && (
          <p className="text-xs text-[#6b7280] mb-6">{macro.source}</p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-terminal-surface border border-terminal-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#3b82f6] mb-2 px-1">GDP Growth</h3>
            <Plot
              data={[
                {
                  x: gdpCountries,
                  y: gdpValues,
                  type: 'bar',
                  marker: { color: '#3b82f6' },
                },
              ]}
              layout={{
                ...{
                  paper_bgcolor: plotTheme.surface,
                  plot_bgcolor: plotTheme.surface,
                  font: { color: plotTheme.font, size: 11 },
                  xaxis: { gridcolor: plotTheme.grid, tickangle: -35 },
                  yaxis: { gridcolor: plotTheme.grid, ticksuffix: '%' },
                  margin: { t: 40, r: 20, b: 80, l: 50 },
                  showlegend: false,
                },
                title: { text: 'GDP Growth by Country', font: { color: plotTheme.font, size: 12 } },
              }}
              style={{ width: '100%', height: '320px' }}
              useResizeHandler
            />
          </div>
          <div className="bg-terminal-surface border border-terminal-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-orange-400 mb-2 px-1">Inflation</h3>
            <Plot
              data={[
                {
                  x: gdpCountries,
                  y: inflationValues,
                  type: 'bar',
                  marker: { color: '#f97316' },
                },
              ]}
              layout={{
                ...{
                  paper_bgcolor: plotTheme.surface,
                  plot_bgcolor: plotTheme.surface,
                  font: { color: plotTheme.font, size: 11 },
                  xaxis: { gridcolor: plotTheme.grid, tickangle: -35 },
                  yaxis: { gridcolor: plotTheme.grid, ticksuffix: '%' },
                  margin: { t: 40, r: 20, b: 80, l: 50 },
                  showlegend: false,
                },
                title: { text: 'Inflation by Country', font: { color: plotTheme.font, size: 12 } },
              }}
              style={{ width: '100%', height: '320px' }}
              useResizeHandler
            />
          </div>
        </div>
      </section>

      {/* Section 4: AI Research */}
      <section className="bg-terminal-surface border border-terminal-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-[#3b82f6] mb-4">Research Any African Asset</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            value={researchQuery}
            onChange={(e) => setResearchQuery(e.target.value)}
            placeholder="e.g. Safaricom SCOM.NR or Nigerian banking sector outlook"
            className="flex-1 bg-terminal-bg border border-terminal-border rounded-lg px-4 py-3 text-terminal-text placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] font-mono"
          />
          <button
            type="button"
            onClick={runResearch}
            disabled={researchLoading || !researchQuery.trim()}
            className="px-6 py-3 bg-[#3b82f6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-terminal-text transition-colors whitespace-nowrap"
          >
            {researchLoading ? 'Researching...' : 'Research with AI'}
          </button>
        </div>
        {researchResult && (
          <div className="bg-terminal-bg border border-terminal-border border-l-4 border-l-[#3b82f6] rounded-lg p-4">
            <p className="text-sm text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
              {researchResult.narrative || 'No narrative available.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

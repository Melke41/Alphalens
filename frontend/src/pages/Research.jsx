import { useState } from 'react'
import { Download } from 'lucide-react'
import api, { sendResearchQuery } from '../utils/api'

const STORAGE_KEY = 'alphalens_reports'
const MAX_REPORTS = 20

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-terminal-border last:border-0">
      <span className="text-xs text-[#6b7280] uppercase tracking-wide">{label}</span>
      <span className="text-sm text-terminal-text font-mono text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  )
}

function MetricTile({ label, value, suffix = '', prefix = '' }) {
  const display =
    value === null || value === undefined ? '—' : `${prefix}${value}${suffix}`
  return (
    <div className="bg-terminal-bg border border-terminal-border rounded-lg p-4">
      <span className="text-xs text-[#6b7280] font-mono uppercase tracking-wide block mb-2">
        {label}
      </span>
      <span className="text-xl font-bold font-mono text-terminal-text">{display}</span>
    </div>
  )
}

function deriveSymbol(queryAnalysis) {
  const asset = queryAnalysis?.asset
  if (!asset) return 'Report'
  return String(asset).trim().toUpperCase().split(/\s+/)[0]
}

function saveReportToLibrary(data) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const analysisType = data.query_analysis?.analysis_type || 'Analysis'
    const symbol = deriveSymbol(data.query_analysis)
    const newReport = {
      id: Date.now(),
      title: `${symbol} ${analysisType}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      category: analysisType,
      symbol: symbol,
      data: data
    }
    const updated = [newReport, ...existing].slice(0, MAX_REPORTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save report:', err)
  }
}

export default function Research() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [saveToast, setSaveToast] = useState(false)

  const runResearch = async () => {
    const trimmed = query.trim()
    if (!trimmed) {
      setError('Please enter a research question')
      return
    }
    setError(null)
    setResults(null)
    setLoading(true)
    try {
      const data = await sendResearchQuery(trimmed)
      setResults(data)

      // Save to localStorage library
      saveReportToLibrary(data)
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 3000)

    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Research failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async () => {
    if (!results) return
    setPdfLoading(true)
    try {
      const symbol = deriveSymbol(results.query_analysis)
      const payload = { ...results, symbol }
      const { data } = await api.post('/report/generate', payload)
      const byteCharacters = atob(data.pdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename || `AlphaLens_${symbol}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'PDF generation failed')
    } finally {
      setPdfLoading(false)
    }
  }

  const qa = results?.query_analysis
  const stats = results?.market_stats

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text p-6 md:p-10 font-mono">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-terminal-text mb-2">AI Research Copilot</h1>
        <p className="text-[#6b7280] text-lg">Natural Language Quantitative Research</p>
      </header>

      <section className="bg-terminal-surface border border-terminal-border rounded-xl p-6 mb-8">
        <label className="block text-sm text-[#6b7280] mb-3">Research Question</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Does Bitcoin drop after Federal Reserve rate hikes?"
          rows={5}
          className="w-full bg-terminal-bg border border-terminal-border rounded-lg px-4 py-3 text-terminal-text placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] font-mono resize-y min-h-[120px] mb-6"
        />
        <button
          type="button"
          onClick={runResearch}
          disabled={loading}
          className="px-8 py-3 bg-[#3b82f6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-terminal-text transition-colors"
        >
          Run Research
        </button>
        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      </section>

      {loading && (
        <div className="flex items-center gap-3 text-[#6b7280] mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3b82f6]" />
          </span>
          <span className="text-sm">AlphaLens is thinking...</span>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-terminal-surface border border-terminal-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[#3b82f6] mb-4">Query Analysis</h2>
              <StatRow label="Asset" value={qa?.asset} />
              <StatRow label="Timeframe" value={qa?.timeframe?.toUpperCase()} />
              <StatRow label="Analysis Type" value={qa?.analysis_type?.toUpperCase()} />
              <StatRow label="Hypothesis" value={qa?.hypothesis} />
              <StatRow label="Narrative" value={results.narrative} />
            </section>

            <section className="bg-terminal-surface border border-terminal-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[#3b82f6] mb-4">Market Stats</h2>
              {stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MetricTile label="Latest Price" value={stats.latest_price} prefix="$" />
                  <MetricTile label="Total Return" value={stats.total_return} suffix="%" />
                  <MetricTile
                    label="Volatility"
                    value={
                      stats.volatility != null
                        ? (parseFloat(stats.volatility) * 100).toFixed(2)
                        : null
                    }
                    suffix="%"
                  />
                  <MetricTile label="Sharpe Ratio" value={stats.sharpe_ratio} />
                  <MetricTile
                    label="Max Drawdown"
                    value={
                      stats.max_drawdown != null
                        ? (parseFloat(stats.max_drawdown) * 100).toFixed(2)
                        : null
                    }
                    suffix="%"
                  />
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">Market data unavailable for this asset.</p>
              )}
            </section>
          </div>

          <section className="bg-terminal-surface border border-terminal-border border-l-4 border-l-[#3b82f6] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-terminal-text mb-4">AI Research Narrative</h2>
            <p className="text-sm text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
              {results.narrative || 'No narrative available.'}
            </p>
          </section>

          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3b82f6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-terminal-text transition-colors"
          >
            <Download className="h-4 w-4" />
            {pdfLoading ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 bg-[#3b82f6] text-terminal-text px-6 py-3 rounded-lg font-mono text-sm shadow-lg z-50 flex items-center gap-2">
          <span>✅</span>
          <span>Report saved to your library</span>
        </div>
      )}
    </div>
  )
}

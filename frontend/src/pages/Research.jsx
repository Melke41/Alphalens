import { useState } from 'react'
import { Download } from 'lucide-react'
import api, { sendResearchQuery } from '../utils/api'

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-[#1f2937] last:border-0">
      <span className="text-xs text-[#6b7280] uppercase tracking-wide">{label}</span>
      <span className="text-sm text-white font-mono text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  )
}

function MetricTile({ label, value, suffix = '', prefix = '' }) {
  const display =
    value === null || value === undefined ? '—' : `${prefix}${value}${suffix}`

  return (
    <div className="bg-[#0a0a0a] border border-[#1f2937] rounded-lg p-4">
      <span className="text-xs text-[#6b7280] font-mono uppercase tracking-wide block mb-2">
        {label}
      </span>
      <span className="text-xl font-bold font-mono text-white">{display}</span>
    </div>
  )
}

function deriveSymbol(queryAnalysis) {
  const asset = queryAnalysis?.asset
  if (!asset) return 'Report'
  return String(asset).trim().toUpperCase().split(/\s+/)[0]
}

export default function Research() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-mono">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">AI Research Copilot</h1>
        <p className="text-[#6b7280] text-lg">Natural Language Quantitative Research</p>
      </header>

      <section className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 mb-8">
        <label className="block text-sm text-[#6b7280] mb-3">Research Question</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Does Bitcoin drop after Federal Reserve rate hikes?"
          rows={5}
          className="w-full bg-[#0a0a0a] border border-[#1f2937] rounded-lg px-4 py-3 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6] font-mono resize-y min-h-[120px] mb-6"
        />
        <button
          type="button"
          onClick={runResearch}
          disabled={loading}
          className="px-8 py-3 bg-[#3b82f6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
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
            <section className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[#3b82f6] mb-4">Query Analysis</h2>
              <StatRow label="Asset" value={qa?.asset} />
              <StatRow label="Timeframe" value={qa?.timeframe?.toUpperCase()} />
              <StatRow label="Analysis Type" value={qa?.analysis_type?.toUpperCase()} />
              <StatRow label="Hypothesis" value={qa?.hypothesis} />
              <StatRow label="Narrative" value={results.narrative} />
            </section>

            <section className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
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

          <section className="bg-[#111827] border border-[#1f2937] border-l-4 border-l-[#3b82f6] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">AI Research Narrative</h2>
            <p className="text-sm text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
              {results.narrative || 'No narrative available.'}
            </p>
          </section>

          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3b82f6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            {pdfLoading ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>
      )}
    </div>
  )
}

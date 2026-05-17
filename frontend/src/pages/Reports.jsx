import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, X, Trash2, BookOpen } from 'lucide-react'
import api from '../utils/api'

const STORAGE_KEY = 'alphalens_reports'
const MAX_REPORTS = 20

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

function getCategoryColor(category) {
  const colors = {
    'regime analysis': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'correlation analysis': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'factor analysis': 'bg-green-500/20 text-green-400 border-green-500/30',
    'momentum analysis': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'volatility analysis': 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[category?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export default function Reports() {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setReports(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load reports:', err)
    }
  }

  const clearAllReports = () => {
    if (window.confirm('Are you sure you want to delete all reports?')) {
      localStorage.removeItem(STORAGE_KEY)
      setReports([])
    }
  }

  const viewReport = (report) => {
    setSelectedReport(report)
  }

  const downloadPdf = async (report) => {
    setPdfLoading(true)
    try {
      const symbol = report.symbol || 'Report'
      const payload = { ...report.data, symbol }
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
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const qa = selectedReport?.data?.query_analysis
  const stats = selectedReport?.data?.market_stats

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-mono">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Research Reports</h1>
          <p className="text-[#6b7280] text-lg">Your Personal Institutional Research Library</p>
        </header>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
            <BookOpen className="h-10 w-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No research reports yet</h2>
          <p className="text-[#6b7280] mb-6 text-center">
            Run a query in the Research page to generate your first report
          </p>
          <button
            onClick={() => navigate('/research')}
            className="px-6 py-3 bg-[#3b82f6] hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors"
          >
            Go to Research
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-mono">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Research Reports</h1>
          <p className="text-[#6b7280] text-lg">Your Personal Institutional Research Library</p>
        </div>
        <button
          onClick={clearAllReports}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear All Reports
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 hover:border-[#3b82f6]/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">{report.symbol}</h3>
              <span className={`px-2 py-1 rounded border text-xs font-semibold uppercase ${getCategoryColor(report.category)}`}>
                {report.category}
              </span>
            </div>
            <p className="text-[10px] text-[#6b7280] mb-4">{report.date}</p>
            <p className="text-sm text-[#d1d5db] mb-6 line-clamp-3">
              {report.data?.narrative?.substring(0, 100)}...
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => viewReport(report)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors text-sm"
              >
                <FileText className="h-4 w-4" />
                View Report
              </button>
              <button
                onClick={() => downloadPdf(report)}
                disabled={pdfLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-lg font-semibold text-white transition-colors text-sm disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#111827] border-b border-[#1f2937] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{selectedReport.title}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-[#1f2937] rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-[#6b7280]" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-[#0a0a0a] border border-[#1f2937] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#3b82f6] mb-4">Query Analysis</h3>
                  <StatRow label="Asset" value={qa?.asset} />
                  <StatRow label="Timeframe" value={qa?.timeframe?.toUpperCase()} />
                  <StatRow label="Analysis Type" value={qa?.analysis_type?.toUpperCase()} />
                  <StatRow label="Hypothesis" value={qa?.hypothesis} />
                  <StatRow label="Narrative" value={selectedReport.data?.narrative} />
                </section>

                <section className="bg-[#0a0a0a] border border-[#1f2937] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#3b82f6] mb-4">Market Stats</h3>
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

              <section className="bg-[#0a0a0a] border border-[#1f2937] border-l-4 border-l-[#3b82f6] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">AI Research Narrative</h3>
                <p className="text-sm text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
                  {selectedReport.data?.narrative || 'No narrative available.'}
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

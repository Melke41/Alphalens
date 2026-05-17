import { useState, useEffect } from 'react'
import { Radio, TrendingUp, TrendingDown, AlertTriangle, Calendar, Newspaper, Globe, Zap, BarChart3, FileText, ChevronRight, Filter } from 'lucide-react'
import { getMarketNews, safeApiCall } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const UPCOMING_EVENTS = [
  { date: "May 20, 2026", event: "Fed Minutes Release", impact: "HIGH", category: "Fed Policy", description: "Federal Reserve meeting minutes — watch for rate guidance" },
  { date: "May 21, 2026", event: "S&P Flash PMI", impact: "MEDIUM", category: "Economic", description: "Preliminary PMI data for manufacturing and services" },
  { date: "May 22, 2026", event: "Initial Jobless Claims", impact: "MEDIUM", category: "Labor", description: "Weekly unemployment claims — labor market health indicator" },
  { date: "May 23, 2026", event: "Existing Home Sales", impact: "LOW", category: "Housing", description: "Monthly existing home sales data" },
  { date: "June 4, 2026", event: "JOLTS Job Openings", impact: "HIGH", category: "Labor", description: "Job openings data — Fed watches this closely" },
  { date: "June 6, 2026", event: "Non-Farm Payrolls", impact: "HIGH", category: "Labor", description: "Most important monthly jobs report — major market mover" },
  { date: "June 11, 2026", event: "CPI Inflation Report", impact: "HIGH", category: "Inflation", description: "Consumer Price Index — key Fed decision input" },
  { date: "June 17-18, 2026", event: "FOMC Meeting", impact: "HIGH", category: "Fed Policy", description: "Federal Reserve rate decision — most watched event" },
  { date: "June 26, 2026", event: "GDP Q1 Final", impact: "HIGH", category: "Growth", description: "Final Q1 2026 GDP reading" },
]

const WEEKLY_SUMMARY = [
  {
    icon: TrendingUp,
    color: "green",
    title: "Week's Best Performer",
    description: "NVIDIA surged 12.5% this week on record AI chip demand and strong earnings guidance, leading the tech rally."
  },
  {
    icon: TrendingDown,
    color: "red",
    title: "Week's Worst Performer",
    description: "Regional banks declined 8.3% amid ongoing concerns about commercial real estate exposure and deposit outflows."
  },
  {
    icon: Calendar,
    color: "blue",
    title: "Biggest Macro Event",
    description: "Fed Chair Powell's testimony signaled a more hawkish stance, pushing rate cut expectations back to September."
  },
  {
    icon: Zap,
    color: "purple",
    title: "Market Theme of the Week",
    description: "AI momentum continued to drive market sentiment, with mega-cap tech outperforming despite broader market volatility."
  }
]

const GLOBAL_SIGNALS = [
  {
    flag: "🇺🇸",
    name: "US Markets",
    status: "BULLISH",
    color: "green",
    explanation: "SPY up 2.1% on strong earnings and economic data"
  },
  {
    flag: "🇨🇳",
    name: "China Risk",
    status: "BEARISH",
    color: "red",
    explanation: "Manufacturing PMI contracts for third month"
  },
  {
    flag: "🛢️",
    name: "Commodities",
    status: "NEUTRAL",
    color: "gray",
    explanation: "Oil down 3% on inventory build, gold flat"
  },
  {
    flag: "💵",
    name: "Dollar Strength",
    status: "BULLISH",
    color: "green",
    explanation: "DXY at 105.5, Fed hawkish tone supports"
  },
  {
    flag: "🌍",
    name: "EM Risk",
    status: "CAUTION",
    color: "orange",
    explanation: "Emerging markets under pressure on dollar strength"
  },
  {
    flag: "⚡",
    name: "Volatility Regime",
    status: "NEUTRAL",
    color: "gray",
    explanation: "VIX at 18.5, within normal range"
  }
]

function getImpactBadge(impact) {
  const badges = {
    HIGH: { icon: Zap, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    MEDIUM: { icon: BarChart3, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    LOW: { icon: FileText, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
  }
  return badges[impact] || badges.LOW
}

function getCategoryColor(category) {
  const colors = {
    'Fed Policy': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Labor': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Inflation': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Growth': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Economic': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Housing': 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  }
  return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

function getDaysAway(dateStr) {
  const eventDate = new Date(dateStr)
  const today = new Date()
  const diffTime = eventDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function FadeCard({ index, children, className = '' }) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {children}
    </div>
  )
}

export default function MarketIntelligence() {
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [eventFilter, setEventFilter] = useState('ALL')
  const navigate = useNavigate()

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    setNewsLoading(true)
    const data = await safeApiCall(() => getMarketNews())
    if (data) setNews(data.news ?? [])
    setNewsLoading(false)
  }

  const filteredEvents = eventFilter === 'ALL' 
    ? UPCOMING_EVENTS 
    : UPCOMING_EVENTS.filter(e => {
        if (eventFilter === 'HIGH IMPACT') return e.impact === 'HIGH'
        return e.category === eventFilter
      })

  const analyzeWithAI = (title, asset) => {
    navigate('/research', { state: { query: `Analyze the impact of ${title} on ${asset}` } })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-mono space-y-8 pb-24">
      <header className="border-b border-[#1f2937] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="h-4 w-4 text-terminal-accent live-indicator-pulse" />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
            Intelligence Feed
          </p>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-terminal-text mb-2">
          Market Intelligence
        </h1>
        <p className="font-mono text-sm text-terminal-muted">
          Real-time economic events, news, and cross-market signals
        </p>
      </header>

      {/* Section 1: Economic Event Calendar */}
      <FadeCard index={0}>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Economic Calendar</h2>
              <p className="text-sm text-[#6b7280]">Upcoming market-moving events</p>
            </div>
            <Calendar className="h-6 w-6 text-terminal-accent" />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {['ALL', 'HIGH IMPACT', 'FED POLICY', 'LABOR', 'INFLATION'].map(filter => (
              <button
                key={filter}
                onClick={() => setEventFilter(filter)}
                className={`px-3 py-1.5 rounded border text-xs font-semibold uppercase transition-colors ${
                  eventFilter === filter
                    ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                    : 'bg-[#0a0a0a] border-[#1f2937] text-[#6b7280] hover:border-[#3b82f6]/50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredEvents.map((event, idx) => {
              const ImpactBadge = getImpactBadge(event.impact)
              const daysAway = getDaysAway(event.date)
              return (
                <div
                  key={idx}
                  className="bg-[#0a0a0a] border border-[#1f2937] rounded-lg p-4 hover:border-[#3b82f6]/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded border text-[10px] font-semibold uppercase flex items-center gap-1 ${ImpactBadge.color}`}>
                        <ImpactBadge.icon className="h-3 w-3" />
                        {event.impact}
                      </span>
                      <span className={`px-2 py-1 rounded border text-[10px] font-semibold uppercase ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6b7280]">
                      {daysAway > 0 ? `${daysAway} days away` : 'Today'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">{event.event}</h3>
                      <p className="text-xs text-[#6b7280]">{event.description}</p>
                    </div>
                    <span className="text-xs text-[#6b7280] whitespace-nowrap ml-4">{event.date}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </FadeCard>

      {/* Section 2: Daily Market News */}
      <FadeCard index={1}>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Today's Market Intelligence</h2>
              <p className="text-sm text-[#6b7280]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <Newspaper className="h-6 w-6 text-terminal-accent" />
          </div>

          {newsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Radio className="h-6 w-6 animate-spin text-terminal-accent" />
              <span className="ml-3 text-sm text-[#6b7280]">Loading market intelligence...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[#0a0a0a] border-l-4 rounded-lg p-5 hover:shadow-lg hover:shadow-${item.color}-500/10 transition-all ${
                    item.sentiment === 'bullish' ? 'border-l-green-500' : 
                    item.sentiment === 'bearish' ? 'border-l-red-500' : 'border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      item.sentiment === 'bullish' ? 'bg-green-500/20' : 
                      item.sentiment === 'bearish' ? 'bg-red-500/20' : 'bg-blue-500/20'
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        item.sentiment === 'bullish' ? 'text-green-400' : 
                        item.sentiment === 'bearish' ? 'text-red-400' : 'text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] text-[#6b7280]">{item.source}</span>
                        <span className="text-[10px] text-[#6b7280]">•</span>
                        <span className="text-[10px] text-[#6b7280]">{item.time}</span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${getImpactBadge(item.impact).color}`}>
                          {item.impact}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${
                          item.sentiment === 'bullish' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                          item.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {item.sentiment === 'bullish' ? '🐂 BULLISH' : item.sentiment === 'bearish' ? '🐻 BEARISH' : '➡️ NEUTRAL'}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-[#d1d5db] mb-3">{item.summary}</p>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-[10px] text-[#6b7280]">Assets Affected:</span>
                        {item.assets_affected.map(asset => (
                          <span key={asset} className="px-2 py-0.5 bg-[#1f2937] rounded text-[10px] text-[#d1d5db] font-mono">
                            {asset}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => analyzeWithAI(item.title, item.assets_affected[0])}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#3b82f6] hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors text-xs"
                      >
                        <Globe className="h-3 w-3" />
                        Analyze with AI
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeCard>

      {/* Section 3: Weekly Market Summary */}
      <FadeCard index={2}>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">This Week in Markets</h2>
              <p className="text-sm text-[#6b7280]">Weekly briefing and key takeaways</p>
            </div>
            <BarChart3 className="h-6 w-6 text-terminal-accent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WEEKLY_SUMMARY.map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className={`bg-[#0a0a0a] border border-[#1f2937] rounded-lg p-5 hover:border-${item.color}-500/50 transition-colors`}
                >
                  <div className={`p-2 rounded-lg mb-3 ${
                    item.color === 'green' ? 'bg-green-500/20' :
                    item.color === 'red' ? 'bg-red-500/20' :
                    item.color === 'blue' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      item.color === 'green' ? 'text-green-400' :
                      item.color === 'red' ? 'text-red-400' :
                      item.color === 'blue' ? 'text-blue-400' : 'text-purple-400'
                    }`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-[#d1d5db] leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </FadeCard>

      {/* Section 4: Global Market Signals */}
      <FadeCard index={3}>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Global Signals</h2>
              <p className="text-sm text-[#6b7280]">Cross-market intelligence</p>
            </div>
            <Globe className="h-6 w-6 text-terminal-accent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GLOBAL_SIGNALS.map((signal, idx) => (
              <div
                key={idx}
                className="bg-[#0a0a0a] border border-[#1f2937] rounded-lg p-5 hover:border-[#3b82f6]/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{signal.flag}</span>
                  <h3 className="text-sm font-semibold text-white">{signal.name}</h3>
                </div>
                <div className="mb-2">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    signal.status === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                    signal.status === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                    signal.status === 'CAUTION' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {signal.status}
                  </span>
                </div>
                <p className="text-xs text-[#d1d5db]">{signal.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeCard>
    </div>
  )
}

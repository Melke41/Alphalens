import { useState } from 'react'
import { Brain, X, Send, Loader2 } from 'lucide-react'
import { sendResearchQuery, safeApiCall } from '../utils/api'

export default function AiCopilot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed }
    setHistory((h) => [...h, userMsg])
    setInput('')
    setLoading(true)

    const data = await safeApiCall(() => sendResearchQuery(trimmed))

    const assistantMsg = {
      role: 'assistant',
      content: data?.narrative || 'Unable to generate a response. Please try again.',
      stats: data?.market_stats,
      analysis: data?.query_analysis,
    }
    setHistory((h) => [...h, assistantMsg])
    setLoading(false)
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="copilot-fab fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#3b82f6] px-5 py-3 font-mono text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:bg-blue-600 hover:shadow-blue-500/50"
        >
          <Brain className="h-5 w-5" />
          Ask AlphaLens
        </button>
      )}

      <div
        className={`copilot-drawer fixed bottom-0 right-0 z-50 flex h-[min(560px,85vh)] w-full max-w-md flex-col border border-terminal-border bg-terminal-surface shadow-2xl sm:bottom-6 sm:right-6 sm:rounded-xl ${
          open ? 'copilot-drawer-open' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-terminal-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-terminal-accent" />
            <h2 className="font-mono text-sm font-semibold text-terminal-text">
              AI Research Copilot
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-terminal-muted transition-colors hover:bg-terminal-elevated hover:text-terminal-text"
            aria-label="Close copilot"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {history.length === 0 && (
            <p className="font-mono text-xs text-terminal-muted">
              Ask about any asset, macro scenario, or quant strategy. Powered by Groq LLM.
            </p>
          )}
          {history.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2.5 ${
                msg.role === 'user'
                  ? 'ml-6 border border-terminal-accent/30 bg-terminal-accent/10'
                  : 'mr-4 border border-terminal-border bg-terminal-bg'
              }`}
            >
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-terminal-muted">
                {msg.role === 'user' ? 'You' : 'AlphaLens'}
              </p>
              <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-terminal-text">
                {msg.content}
              </p>
              {msg.stats && (
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-terminal-border pt-2">
                  {msg.stats.latest_price != null && (
                    <StatChip label="Price" value={`$${msg.stats.latest_price}`} />
                  )}
                  {msg.stats.total_return != null && (
                    <StatChip label="Return" value={`${msg.stats.total_return}%`} />
                  )}
                  {msg.stats.sharpe_ratio != null && (
                    <StatChip label="Sharpe" value={msg.stats.sharpe_ratio} />
                  )}
                  {msg.stats.volatility != null && (
                    <StatChip
                      label="Vol"
                      value={`${(msg.stats.volatility * 100).toFixed(1)}%`}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 font-mono text-xs text-terminal-accent">
              <Loader2 className="h-4 w-4 animate-spin" />
              AlphaLens is thinking...
            </div>
          )}
        </div>

        <div className="border-t border-terminal-border p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a research question..."
              disabled={loading}
              className="flex-1 rounded-lg border border-terminal-border bg-terminal-bg px-3 py-2 font-mono text-sm text-terminal-text outline-none focus:border-terminal-accent/50 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3b82f6] text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="rounded border border-terminal-border/60 bg-terminal-elevated/50 px-2 py-1">
      <p className="font-mono text-[9px] text-terminal-muted">{label}</p>
      <p className="font-mono text-xs font-semibold text-terminal-text">{value}</p>
    </div>
  )
}

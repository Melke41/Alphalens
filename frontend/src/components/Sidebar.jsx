import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Brain,
  LineChart,
  Calculator,
  Globe2,
  FileText,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/research', label: 'Research', icon: Brain },
  { to: '/markets', label: 'Markets', icon: LineChart },
  { to: '/quant', label: 'Quant Tools', icon: Calculator },
  { to: '/macro', label: 'Macro & Fed', icon: Globe2 },
  { to: '/reports', label: 'Reports', icon: FileText },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-terminal-border bg-terminal-bg">
      <div className="flex h-16 shrink-0 items-center border-b border-terminal-border px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-terminal-accent/40 bg-terminal-accent/5 font-mono text-xs font-bold text-terminal-accent shadow-glow">
            α
          </div>
          <div className="leading-none">
            <div className="font-mono text-[11px] font-bold tracking-[0.35em] text-white">
              ALPHA
            </div>
            <div className="font-mono text-[11px] font-bold tracking-[0.35em] text-terminal-accent">
              LENS
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
          Navigation
        </p>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border border-terminal-accent/20 bg-terminal-accent/10 text-terminal-accent shadow-glow'
                  : 'border border-transparent text-terminal-muted hover:bg-terminal-elevated hover:text-terminal-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={
                    isActive
                      ? 'text-terminal-accent'
                      : 'text-terminal-muted group-hover:text-terminal-text'
                  }
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                <span className="font-mono text-[13px] tracking-tight">{label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-terminal-accent shadow-[0_0_8px_#3b82f6]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-terminal-border p-4">
        <div className="flex items-center gap-2.5 rounded-md border border-terminal-accent/20 bg-terminal-accent/5 px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terminal-accent opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 animate-pulse-slow rounded-full bg-terminal-accent shadow-[0_0_10px_#3b82f6]" />
          </span>
          <span className="font-mono text-xs font-bold tracking-[0.25em] text-terminal-accent">
            LIVE
          </span>
          <span className="ml-auto font-mono text-[10px] text-terminal-muted">
            FEED
          </span>
        </div>
        <p className="mt-2 text-center font-mono text-[9px] text-terminal-muted/70">
          INSTITUTIONAL DATA STREAM
        </p>
      </div>
    </aside>
  )
}

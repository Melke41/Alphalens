import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Brain,
  LineChart,
  Calculator,
  Globe2,
  FileText,
  ChevronRight,
  Menu,
  Radio,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/research', label: 'Research', icon: Brain },
  { to: '/markets', label: 'Markets', icon: LineChart },
  { to: '/market-intelligence', label: 'Market Intel', icon: Radio },
  { to: '/quant', label: 'Quant Tools', icon: Calculator },
  { to: '/macro', label: 'Macro & Fed', icon: Globe2 },
  { to: '/african', label: 'African Markets', emoji: '🌍' },
  { to: '/reports', label: 'Reports', icon: FileText },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useApp()

  return (
    <aside
      className={`sidebar-transition fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-terminal-border bg-terminal-bg ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div
        className={`flex h-16 shrink-0 items-center border-b border-terminal-border ${
          sidebarCollapsed ? 'flex-col justify-center gap-1 px-1' : 'justify-between px-4'
        }`}
      >
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-terminal-accent/40 bg-terminal-accent/5 font-mono text-xs font-bold text-terminal-accent shadow-glow">
              α
            </div>
            <div className="leading-none">
              <div className="font-mono text-[11px] font-bold tracking-[0.35em] text-terminal-text">
                ALPHA
              </div>
              <div className="font-mono text-[11px] font-bold tracking-[0.35em] text-terminal-accent">
                LENS
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded border border-terminal-accent/40 bg-terminal-accent/5 font-mono text-xs font-bold text-terminal-accent">
            α
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-terminal-muted transition-colors hover:bg-terminal-elevated hover:text-terminal-accent"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {!sidebarCollapsed && (
          <p className="mb-3 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
            Navigation
          </p>
        )}
        {navItems.map(({ to, label, icon: Icon, emoji, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={sidebarCollapsed ? label : undefined}
            className={({ isActive }) =>
              `group flex items-center rounded-md py-2.5 text-sm font-medium transition-all ${
                sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
              } ${
                isActive
                  ? 'border border-terminal-accent/20 bg-terminal-accent/10 text-terminal-accent shadow-glow'
                  : 'border border-transparent text-terminal-muted hover:bg-terminal-elevated hover:text-terminal-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {emoji ? (
                  <span className="text-base leading-none" aria-hidden>
                    {emoji}
                  </span>
                ) : (
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? 'text-terminal-accent'
                        : 'text-terminal-muted group-hover:text-terminal-text'
                    }
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                )}
                {!sidebarCollapsed && (
                  <>
                    <span className="font-mono text-[13px] tracking-tight">{label}</span>
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-terminal-accent shadow-[0_0_8px_#3b82f6]" />
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-terminal-border p-3">
        <div
          className={`flex items-center rounded-md border border-terminal-accent/20 bg-terminal-accent/5 ${
            sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terminal-accent opacity-60" />
            <span className="live-indicator-pulse relative inline-flex h-2.5 w-2.5 rounded-full bg-terminal-accent" />
          </span>
          {!sidebarCollapsed && (
            <>
              <span className="font-mono text-xs font-bold tracking-[0.25em] text-terminal-accent">
                LIVE
              </span>
              <span className="ml-auto font-mono text-[10px] text-terminal-muted">FEED</span>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

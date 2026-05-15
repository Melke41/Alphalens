export default function Card({ title, subtitle, children, className = '', accent }) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-terminal-border bg-terminal-surface shadow-card transition-colors hover:border-terminal-accent/30 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-terminal-border px-4 py-3">
        <div>
          <h3 className="font-mono text-sm font-semibold tracking-tight text-terminal-text">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-terminal-muted">
              {subtitle}
            </p>
          )}
        </div>
        {accent && (
          <span className="rounded border border-terminal-accent/20 bg-terminal-accent/5 px-2 py-0.5 font-mono text-[10px] text-terminal-accent">
            {accent}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  )
}

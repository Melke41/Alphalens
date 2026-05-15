export default function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-8">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">
          AlphaLens Platform
        </p>
        <h1 className="font-mono text-3xl font-bold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 font-mono text-sm text-terminal-muted">
          Coming in next phase
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-lg rounded-lg border border-terminal-border bg-terminal-surface px-12 py-16 text-center shadow-card">
          {Icon && (
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-terminal-border bg-terminal-elevated">
              <Icon className="h-8 w-8 text-terminal-accent/60" strokeWidth={1.25} />
            </div>
          )}
          <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-terminal-accent/50 to-transparent" />
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-terminal-muted">
            Module in development
          </p>
          {description && (
            <p className="mt-4 text-sm leading-relaxed text-terminal-muted/80">
              {description}
            </p>
          )}
          <div className="mt-8 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-8 rounded-full bg-terminal-border"
                style={{ opacity: 1 - i * 0.25 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: 'var(--terminal-bg)',
          surface: 'var(--terminal-surface)',
          elevated: 'var(--terminal-elevated)',
          border: 'var(--terminal-border)',
          accent: '#3b82f6',
          'accent-dim': '#2563eb',
          muted: 'var(--terminal-muted)',
          text: 'var(--terminal-text)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 130, 246, 0.15)',
        card: '0 1px 0 rgba(59, 130, 246, 0.08) inset',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

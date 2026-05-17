import { useEffect, useState } from 'react'

export default function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 900,
  className = '',
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value == null || Number.isNaN(Number(value))) return

    const target = Number(value)
    const start = display
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(start + (target - start) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  const formatted =
    value == null
      ? '—'
      : `${prefix}${Number(display).toFixed(decimals)}${suffix}`

  return <span className={className}>{formatted}</span>
}

/** Simple US equity session check (Mon–Fri, 9:30–16:00 ET). */
export function isMarketOpen(date = new Date()) {
  const et = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  )
  const day = et.getDay()
  if (day === 0 || day === 6) return false

  const minutes = et.getHours() * 60 + et.getMinutes()
  const open = 9 * 60 + 30
  const close = 16 * 60
  return minutes >= open && minutes < close
}

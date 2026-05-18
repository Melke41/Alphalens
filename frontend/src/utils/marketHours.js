export function isMarketOpen(date = new Date()) {
  const day = date.getUTCDay()
  // 0 = Sunday, 6 = Saturday
  // Open Monday (1) through Friday (5), all 24 hours
  return day >= 1 && day <= 5
}

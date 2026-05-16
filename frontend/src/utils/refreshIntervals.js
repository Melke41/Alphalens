/** Formerly 60s — reduced to limit backend load */
export const REFRESH_INTERVAL_5MIN = 300000

/** Formerly 30s — reduced to limit backend load */
export const REFRESH_INTERVAL_3MIN = 180000

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

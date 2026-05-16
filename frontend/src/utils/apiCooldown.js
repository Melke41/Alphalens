const COOLDOWN_MS = 5 * 60 * 1000

let cooldownUntil = 0

export function isApiCooldown() {
  return Date.now() < cooldownUntil
}

export function activateApiCooldown() {
  cooldownUntil = Date.now() + COOLDOWN_MS
}

export function getCooldownRemainingMs() {
  return Math.max(0, cooldownUntil - Date.now())
}

export class ApiCooldownError extends Error {
  constructor() {
    super('API requests paused after a failure')
    this.name = 'ApiCooldownError'
    this.silent = true
  }
}

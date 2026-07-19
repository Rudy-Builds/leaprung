// Which puzzle is "today", and how long until the next one.
//
// Local midnight, not UTC — matching Wordle. The countdown has to read "next
// puzzle in 6h" against the player's own clock; under UTC a US-West player's
// puzzle would flip at 5pm, which makes the countdown look broken at exactly the
// moment it's most visible.
//
// The accepted cost: #N isn't globally simultaneous. For up to a day a player in
// NZ is on #42 while one in California is still on #41, so a shared card names a
// start/end the recipient hasn't reached yet. Those two words are the public part
// of the puzzle (they're in the header before you play, not the answer), so it
// leaks little — and a countdown that lies would be worse.

import { puzzleFromPath } from './puzzle.js'

const DAY_MS = 86400000

/** 2026-07-16 is Leapword #1. Must never move: it defines what every #N means.
 * Exported so Boot can assert the schedule was generated against the same
 * epoch — a regenerated schedule with a shifted epoch would silently hand
 * everyone the wrong day's puzzle. */
export const EPOCH_ISO = '2026-07-16'
// Date-only ISO strings parse as UTC midnight per spec, so this equals
// Date.UTC(2026, 6, 16) — one constant, two representations.
const EPOCH_UTC = Date.parse(EPOCH_ISO)

/**
 * Today's puzzle number, counting from 1.
 *
 * Local Y/M/D components are fed through Date.UTC so both sides of the
 * subtraction are exact multiples of 86400000. Diffing two local `new Date(y,m,d)`
 * values would break across a DST boundary, where a day is 23 or 25 hours —
 * hence Date.UTC here and Math.round (not floor) below.
 */
export function dayNumber(now = new Date()) {
  const localMidnightAsUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((localMidnightAsUTC - EPOCH_UTC) / DAY_MS) + 1
}

/** Milliseconds until local midnight. */
export function msUntilNextPuzzle(now = new Date()) {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return nextMidnight.getTime() - now.getTime()
}

/** "6h 12m" / "12m" / "48s" — the shape shrinks as it gets close. */
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/**
 * The puzzle for day `n`.
 *
 * Wraps rather than running off the end, so a player in 2042 gets a repeat
 * instead of a white screen. The double-modulo keeps the index positive if `n`
 * is somehow <= 0 — a clock set before the epoch shouldn't crash the app either.
 */
export function puzzleForDay(n, schedule) {
  const len = schedule.paths.length
  const i = (((n - 1) % len) + len) % len
  return puzzleFromPath(schedule.paths[i], schedule)
}

// The streak: the one piece of state that must survive midnight.
//
// Today's progress (storage.js) is day-scoped and wiped every midnight — that's
// correct for "one play per day". A streak is the opposite: it's the thread that
// runs ACROSS days, so it lives under its own key and is folded forward here.
// `lastDay` is the puzzle number the streak was last advanced on; it's what makes
// advancing idempotent and makes "were these two days consecutive?" answerable.

export const DEFAULT_STREAK = Object.freeze({
  current: 0,
  max: 0,
  lastDay: null,
  played: 0,
  wins: 0,
})

/**
 * Fold one day's result into the streak. Pure and idempotent.
 *
 * Idempotency is load-bearing: the result screen re-renders and re-persists on
 * every refresh of an already-finished day, so this MUST be safe to call again
 * with the same day. It is — a day at or before `lastDay` returns the input
 * unchanged (same reference), which callers use to skip a redundant write.
 *
 * A streak advances only on consecutive days (`day === lastDay + 1`): miss a day
 * and even a win starts you over at 1. A loss always resets to 0. That severity
 * is the whole retention mechanic — a streak you can actually lose is a reason to
 * come back tomorrow.
 *
 * @param {typeof DEFAULT_STREAK | null} prev
 * @param {{ day: number, won: boolean }} result
 */
export function nextStreak(prev, { day, won }) {
  const s = prev ?? DEFAULT_STREAK

  // Already counted this day (a refresh, a re-render), or an earlier day than the
  // streak already reflects (a clock rolled back, or a future archive replay of a
  // past puzzle). Either way: don't disturb a streak built on later days.
  if (s.lastDay != null && day <= s.lastDay) return s

  const consecutive = s.lastDay != null && day === s.lastDay + 1
  const current = won ? (consecutive ? s.current + 1 : 1) : 0

  return {
    current,
    max: Math.max(s.max, current),
    lastDay: day,
    played: s.played + 1,
    wins: s.wins + (won ? 1 : 0),
  }
}

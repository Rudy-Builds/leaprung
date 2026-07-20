import { useEffect, useState } from 'react'
import { nextStreak } from '../game/streak.js'
import { loadStreak, recordDailyResult } from './storage.js'

/**
 * The player's streak, and what just happened to it this game.
 *
 * `baseline` is the streak as it stood when this component mounted — read once,
 * never re-set. LeapwordGame is keyed by day and remounts at midnight, so each
 * day gets a fresh baseline reflecting yesterday's record. Deriving the DISPLAYED
 * streak from that stable baseline (rather than from the effect's write-back)
 * means the victory modal shows the incremented number on its very first frame —
 * no flash from N to N+1 while an effect catches up.
 *
 * The effect's only job is the side effect of persisting. It is safe to fire more
 * than once — recordDailyResult is idempotent per day.
 *
 * @param {number} dayNumber  today's puzzle number
 * @param {'playing'|'won'|'lost'} status
 * @returns {{ current: number, max: number, brokeStreak: number }}
 */
export function useStreak(dayNumber, status) {
  const [baseline] = useState(loadStreak)
  // A null dayNumber is an off-cycle play (an archive/challenge puzzle): it never
  // touches the streak — not recorded, not even derived — so `finished` gates on
  // it too, leaving `view` as the untouched baseline.
  const finished = (status === 'won' || status === 'lost') && dayNumber != null
  const won = status === 'won'

  useEffect(() => {
    if (dayNumber == null || !finished) return
    recordDailyResult(dayNumber, won)
  }, [dayNumber, finished, won])

  const view = finished ? nextStreak(baseline, { day: dayNumber, won }) : baseline

  // The streak this loss just ended — shown only in the session where the loss
  // happens, when the baseline still remembers it. After a refresh the baseline
  // already reads today with current 0, and we don't re-open the wound.
  const brokeStreak =
    finished && !won && baseline.lastDay !== dayNumber ? baseline.current : 0

  return { current: view.current, max: view.max, brokeStreak }
}

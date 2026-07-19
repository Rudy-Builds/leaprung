import { useEffect, useState } from 'react'
import { dayNumber, msUntilNextPuzzle } from '../game/daily.js'

/**
 * Today's puzzle number, kept live.
 *
 * The visibilitychange listener is the point: a phone left open overnight and
 * unlocked in the morning must roll over to the new puzzle, not sit on a
 * countdown reading "0s" against yesterday's board. The midnight timeout
 * alone would eventually catch it, but background timers are throttled hard on
 * mobile, so the tab coming back to the foreground is the signal that
 * actually fires.
 */
export function useDayNumber() {
  const [n, setN] = useState(() => dayNumber())

  useEffect(() => {
    let id
    const check = () => setN(dayNumber())
    // Aimed at midnight rather than polling every minute: a foreground tab
    // flips the instant the countdown hits zero, not up to 60s later. The
    // +250ms lands safely on the far side of the boundary, and re-arming
    // after each check covers throttled timers firing early or late.
    const arm = () => {
      id = setTimeout(() => {
        check()
        arm()
      }, msUntilNextPuzzle() + 250)
    }
    arm()
    const onVisible = () => {
      if (!document.hidden) check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return n
}

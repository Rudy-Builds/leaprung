import { useEffect, useState } from 'react'
import { dayNumber } from '../game/daily.js'

/**
 * Today's puzzle number, kept live.
 *
 * The visibilitychange listener is the point: a phone left open overnight and
 * unlocked in the morning must roll over to the new puzzle, not sit on a
 * countdown reading "0s" against yesterday's board. The interval alone would
 * eventually catch it, but background timers are throttled hard on mobile, so
 * the tab coming back to the foreground is the signal that actually fires.
 */
export function useDayNumber() {
  const [n, setN] = useState(() => dayNumber())

  useEffect(() => {
    const check = () => setN(dayNumber())
    const id = setInterval(check, 60_000)
    const onVisible = () => {
      if (!document.hidden) check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return n
}

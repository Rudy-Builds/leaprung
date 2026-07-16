import React, { useEffect, useState } from 'react'
import { formatCountdown, msUntilNextPuzzle } from '../game/daily.js'

/**
 * Time until the next puzzle. Display only — the actual rollover is owned by
 * useDayNumber, so this can't disagree with which puzzle is being shown.
 */
export function Countdown() {
  const [ms, setMs] = useState(msUntilNextPuzzle)

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextPuzzle()), 1000)
    return () => clearInterval(id)
  }, [])

  return <p className="countdown">Next puzzle in {formatCountdown(ms)}</p>
}

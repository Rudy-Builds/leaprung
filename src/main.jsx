import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LeaprungGame } from './components/LeaprungGame.jsx'
import { puzzleForDay } from './game/daily.js'
import { WORD_LEN } from './game/puzzle.js'
import { useDayNumber } from './state/useDayNumber.js'
import { useViewportHeight } from './state/useViewportHeight.js'
import './styles/app.css'

// Loads the dictionary, synonym map and daily schedule once, then hands them to
// the game. All three are fetched in parallel against WORD_LEN rather than
// chaining on the schedule's own wordLength — one round trip beats two, and the
// assertion below catches the only way that could be wrong.
function Boot() {
  useViewportHeight()
  const [assets, setAssets] = useState(null)
  const [error, setError] = useState(null)
  const day = useDayNumber()

  useEffect(() => {
    Promise.all([
      fetch(`/dict/${WORD_LEN}.json`).then((r) => r.json()),
      fetch(`/syn/${WORD_LEN}.json`).then((r) => r.json()),
      fetch(`/schedule/${WORD_LEN}.json`).then((r) => r.json()),
    ])
      .then(([words, synMap, schedule]) => {
        if (schedule.wordLength !== WORD_LEN) {
          throw new Error(`schedule is ${schedule.wordLength}-letter, app is ${WORD_LEN}`)
        }
        setAssets({ dictSet: new Set(words), synMap, schedule })
      })
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="boot">Failed to load: {error}</div>
  if (!assets) return <div className="boot">Loading…</div>

  // key={day} remounts at midnight, which is what re-runs useGame's lazy
  // initialiser against the new day's (empty) saved progress. Without it, a tab
  // left open overnight would roll the puzzle but keep yesterday's ladder.
  return (
    <LeaprungGame
      key={day}
      number={day}
      puzzle={puzzleForDay(day, assets.schedule)}
      dictSet={assets.dictSet}
      synMap={assets.synMap}
    />
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boot />
  </React.StrictMode>,
)

import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LeapwordGame } from './components/LeapwordGame.jsx'
import { puzzleForDay, EPOCH_ISO } from './game/daily.js'
import { WORD_LEN } from './game/puzzle.js'
import { useDayNumber } from './state/useDayNumber.js'
import { useViewportHeight } from './state/useViewportHeight.js'
import './styles/app.css'

/**
 * fetch + parse, with an error a human can act on.
 *
 * wrangler.jsonc sets not_found_handling: single-page-application, so a missing
 * asset doesn't 404 — it serves index.html with a 200. Left alone, a half-shipped
 * deploy surfaces as "Unexpected token '<'", which names neither the file nor the
 * cause. Checking the content type turns that into something debuggable.
 */
async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('json')) {
    throw new Error(`${url} returned ${type || 'no content-type'}, not JSON — incomplete deploy?`)
  }
  return res.json()
}

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
      getJson(`/dict/${WORD_LEN}.json`),
      getJson(`/syn/${WORD_LEN}.json`),
      getJson(`/schedule/${WORD_LEN}.json`),
    ])
      .then(([words, synMap, schedule]) => {
        if (schedule.wordLength !== WORD_LEN) {
          throw new Error(`schedule is ${schedule.wordLength}-letter, app is ${WORD_LEN}`)
        }
        // dayNumber() counts from EPOCH_ISO; the schedule indexes its paths
        // from its own epoch. If they ever disagree, every player silently
        // gets the wrong day's puzzle — fail loudly instead.
        if (schedule.epoch !== EPOCH_ISO) {
          throw new Error(`schedule epoch is ${schedule.epoch}, app expects ${EPOCH_ISO}`)
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
    <LeapwordGame
      key={day}
      number={day}
      puzzle={puzzleForDay(day, assets.schedule)}
      dictSet={assets.dictSet}
      synMap={assets.synMap}
    />
  )
}

// Dev-only guard: main.jsx is the module Vite re-executes on every hot update,
// and calling createRoot twice on the same container warns and double-mounts.
// The root survives updates in import.meta.hot.data; prod runs this once anyway.
const container = document.getElementById('root')
const root = import.meta.hot
  ? (import.meta.hot.data.root ??= createRoot(container))
  : createRoot(container)
root.render(
  <React.StrictMode>
    <Boot />
  </React.StrictMode>,
)

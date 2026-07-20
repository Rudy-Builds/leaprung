import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LeapwordGame } from './components/LeapwordGame.jsx'
import { puzzleForDay, EPOCH_ISO } from './game/daily.js'
import { WORD_LEN } from './game/puzzle.js'
import { useDayNumber } from './state/useDayNumber.js'
import { useRoute } from './state/useRoute.js'
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
  const today = useDayNumber()
  const { requestedDay, navigate } = useRoute()

  // A shared "/N" link can name a puzzle that isn't the visitor's today. A future
  // number — a timezone-skewed share from someone a day ahead (see daily.js) —
  // isn't playable early: fall back to today and rewrite the misleading URL to
  // "/" (replace, so it leaves no Back entry). Past and today are handled below.
  const isFuture = requestedDay != null && requestedDay > today
  useEffect(() => {
    if (isFuture) navigate('/', { replace: true })
  }, [isFuture, navigate])

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

  // A past number is an archive/challenge play — the exact puzzle a link named,
  // shown off-cycle. Today (or no request, or the future fallback above) is the
  // real daily. `number` drives what's shown and shared; `isArchive` decides
  // whether it counts toward the streak (LeapwordGame turns persistence off).
  const isArchive = requestedDay != null && requestedDay < today
  const number = isArchive ? requestedDay : today

  // key={number} remounts when the puzzle changes — at midnight (daily rolls
  // forward) and when navigating between an archive puzzle and today. That's what
  // re-runs useGame's lazy initialiser against the right day's saved progress;
  // without it a tab left open overnight would roll the puzzle but keep the ladder.
  return (
    <LeapwordGame
      key={number}
      number={number}
      isArchive={isArchive}
      today={today}
      onPlayToday={() => navigate('/')}
      puzzle={puzzleForDay(number, assets.schedule)}
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

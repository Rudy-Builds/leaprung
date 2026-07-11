import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LeaprungGame } from './components/LeaprungGame.jsx'
import { PUZZLE } from './game/puzzle.js'
import './styles/app.css'

// Loads the bundled dictionary + synonym map once, then hands them to the game.
function Boot() {
  const [assets, setAssets] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const len = PUZZLE.wordLength
    Promise.all([
      fetch(`/dict/${len}.json`).then((r) => r.json()),
      fetch(`/syn/${len}.json`).then((r) => r.json()),
    ])
      .then(([words, synMap]) => setAssets({ dictSet: new Set(words), synMap }))
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="boot">Failed to load: {error}</div>
  if (!assets) return <div className="boot">Loading…</div>
  return <LeaprungGame puzzle={PUZZLE} dictSet={assets.dictSet} synMap={assets.synMap} />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boot />
  </React.StrictMode>
)

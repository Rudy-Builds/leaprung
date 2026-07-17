import React, { useState } from 'react'
import { useGame } from '../state/useGame.js'
import { hasSeenHelp, markHelpSeen } from '../state/storage.js'
import { PuzzleHeader } from './PuzzleHeader.jsx'
import { WordChain } from './WordChain.jsx'
import { ActiveWordTiles } from './ActiveWordTiles.jsx'
import { LeapPanel } from './LeapPanel.jsx'
import { ResultModal } from './ResultModal.jsx'
import { HelpModal } from './HelpModal.jsx'

export function LeapwordGame({ puzzle, dictSet, synMap, number }) {
  const game = useGame(puzzle, dictSet, synMap, { dayNumber: number })
  // The rules used to be opt-in behind a button no first-timer had a reason to
  // press. Lazy initialiser: hasSeenHelp touches localStorage, so it must not
  // run on every render. This component is keyed by day and remounts at
  // midnight, which re-runs this — by then the flag is set, so it stays shut.
  const [helpOpen, setHelpOpen] = useState(() => !hasSeenHelp())
  const playing = game.status === 'playing'

  // Marked on close rather than on open: dismissing it is the signal they've
  // read it, so refreshing with it still up shows it again. Idempotent, so a
  // manual open/close later just rewrites the same flag.
  const closeHelp = () => {
    markHelpSeen()
    setHelpOpen(false)
  }

  return (
    <>
      <div className="game">
        <header className="topbar">
          <h1 className="brand">
            Leapword <span className="brand-sub">daily word ladder</span>
          </h1>
        </header>

        <PuzzleHeader
          start={puzzle.start}
          end={puzzle.end}
          par={puzzle.par}
          movesUsed={game.movesUsed}
          moveCap={game.moveCap}
          leapsRemaining={game.leapsRemaining}
          onHelp={() => setHelpOpen(true)}
        />

        <WordChain path={game.path} end={puzzle.end} />

        {playing && (
          <div className="play">
            <ActiveWordTiles
              current={game.current}
              onSubmit={game.submitWord}
              onEdit={game.clearMessage}
              message={game.message}
            />
            <LeapPanel
              options={game.leapOptions}
              leapsRemaining={game.leapsRemaining}
              onLeap={game.useLeap}
            />
          </div>
        )}
      </div>

      {/* Fixed overlays live outside .game so that no transform/filter/contain
          added there later can capture them into a 460px column. */}
      {!playing && (
        <ResultModal
          status={game.status}
          stars={game.stars}
          path={game.path}
          start={puzzle.start}
          end={puzzle.end}
          par={puzzle.par}
          leapsUsed={game.leapsUsed}
          solution={puzzle.solution}
          number={number}
          onHelp={() => setHelpOpen(true)}
        />
      )}

      {/* Renders after ResultModal, and that order is load-bearing: both
          overlays are z-index 10, so paint order falls back to the DOM. Put
          help first and the result modal covers it — the ? would look dead. */}
      {helpOpen && (
        <HelpModal
          par={puzzle.par}
          moveCap={game.moveCap}
          leaps={puzzle.leaps}
          onClose={closeHelp}
        />
      )}
    </>
  )
}

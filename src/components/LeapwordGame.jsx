import React, { useState } from 'react'
import { useGame } from '../state/useGame.js'
import { useStreak } from '../state/useStreak.js'
import { hasSeenHelp, markHelpSeen } from '../state/storage.js'
import { PuzzleHeader } from './PuzzleHeader.jsx'
import { WordChain } from './WordChain.jsx'
import { ActiveWordTiles } from './ActiveWordTiles.jsx'
import { LeapPanel } from './LeapPanel.jsx'
import { ResultModal } from './ResultModal.jsx'
import { HelpModal } from './HelpModal.jsx'

export function LeapwordGame({ puzzle, dictSet, synMap, number, isArchive = false, today, onPlayToday }) {
  // Archive/challenge plays are ephemeral and off the streak: a null dayNumber
  // turns off both the day-scoped progress save (a refresh just restarts it,
  // harmless off-cycle) and the streak recording, while `number` still drives the
  // #N shown and shared. The daily passes its real number through unchanged.
  const storeDay = isArchive ? null : number
  const game = useGame(puzzle, dictSet, synMap, { dayNumber: storeDay })
  // Reads the streak once on mount and records the result when a daily game ends.
  const streak = useStreak(storeDay, game.status)
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

        {/* Off-cycle play arrived via a shared "/N" link. Name it as a past
            puzzle so the streak's absence isn't a surprise, and give a one-tap
            way back to today's real daily. */}
        {isArchive && (
          <div className="archive-bar">
            <span>Leapword #{number} · a past puzzle</span>
            <button type="button" className="archive-today" onClick={onPlayToday}>
              Play today’s #{today} →
            </button>
          </div>
        )}

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
          streak={isArchive ? undefined : streak}
          isArchive={isArchive}
          today={today}
          onPlayToday={onPlayToday}
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

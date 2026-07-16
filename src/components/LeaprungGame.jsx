import React, { useState } from 'react'
import { useGame } from '../state/useGame.js'
import { PuzzleHeader } from './PuzzleHeader.jsx'
import { WordChain } from './WordChain.jsx'
import { ActiveWordTiles } from './ActiveWordTiles.jsx'
import { LeapPanel } from './LeapPanel.jsx'
import { ResultModal } from './ResultModal.jsx'
import { HelpModal } from './HelpModal.jsx'

export function LeaprungGame({ puzzle, dictSet, synMap, number }) {
  const game = useGame(puzzle, dictSet, synMap, { dayNumber: number })
  const [helpOpen, setHelpOpen] = useState(false)
  const playing = game.status === 'playing'

  return (
    <>
      <div className="game">
        <header className="topbar">
          <h1 className="brand">
            Leaprung <span className="brand-sub">daily word ladder</span>
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
      {helpOpen && (
        <HelpModal
          par={puzzle.par}
          moveCap={game.moveCap}
          leaps={puzzle.leaps}
          onClose={() => setHelpOpen(false)}
        />
      )}

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
        />
      )}
    </>
  )
}

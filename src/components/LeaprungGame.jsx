import React from 'react'
import { useGame } from '../state/useGame.js'
import { PuzzleHeader } from './PuzzleHeader.jsx'
import { WordChain } from './WordChain.jsx'
import { ActiveWordTiles } from './ActiveWordTiles.jsx'
import { LeapPanel } from './LeapPanel.jsx'
import { ResultModal } from './ResultModal.jsx'

export function LeaprungGame({ puzzle, dictSet, synMap }) {
  const game = useGame(puzzle, dictSet, synMap)
  const playing = game.status === 'playing'

  return (
    <div className="game">
      <h1 className="brand">
        Leaprung <span className="brand-sub">daily word ladder</span>
      </h1>

      <PuzzleHeader
        start={puzzle.start}
        end={puzzle.end}
        par={puzzle.par}
        movesUsed={game.movesUsed}
        moveCap={game.moveCap}
        leapsRemaining={game.leapsRemaining}
      />

      <WordChain path={game.path} end={puzzle.end} />

      {playing && (
        <>
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
        </>
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
          onReset={game.reset}
        />
      )}
    </div>
  )
}

import React from 'react'

// Mini tile row used for the start/end words in the header.
function MiniWord({ word, tone }) {
  return (
    <div className={`miniword ${tone}`}>
      {word.split('').map((ch, i) => (
        <span className="minitile" key={i}>
          {ch}
        </span>
      ))}
    </div>
  )
}

export function PuzzleHeader({ start, end, par, movesUsed, moveCap, leapsRemaining }) {
  return (
    <div className="header">
      <div className="header-words">
        <MiniWord word={start} tone="start" />
        <span className="arrow">→</span>
        <MiniWord word={end} tone="end" />
      </div>
      <div className="header-stats">
        <span className="stat">
          <b>{par}</b> par
        </span>
        <span className="stat">
          <b>{movesUsed}</b>/{moveCap} moves
        </span>
        <span className="stat">
          <b>{leapsRemaining}</b> {leapsRemaining === 1 ? 'leap' : 'leaps'} ⤳
        </span>
      </div>
    </div>
  )
}

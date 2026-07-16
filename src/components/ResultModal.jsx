import React from 'react'
import { isOneLetterDiff } from '../game/rules.js'

// A path rendered inline, with ⤳ marking the steps that were leaps.
function PathLine({ path }) {
  return (
    <div className="modal-chain">
      {path.map((word, i) => {
        const leap = i > 0 && !isOneLetterDiff(path[i - 1], word)
        return (
          <span className="modal-step" key={`${word}-${i}`}>
            {i > 0 && <span className="modal-sep">{leap ? '⤳' : '·'}</span>}
            {word}
          </span>
        )
      })}
    </div>
  )
}

export function ResultModal({ status, stars, path, start, end, par, leapsUsed, solution, onReset }) {
  const won = status === 'won'
  const steps = path.length - 1

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true">
        <h2 className="modal-title">{won ? 'Solved!' : 'Out of moves'}</h2>

        <div className="stars" aria-label={`${stars} out of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={`star ${n <= stars ? 'on' : ''}`}>
              ★
            </span>
          ))}
        </div>

        <p className="modal-summary">
          {won
            ? `${start} → ${end} in ${steps} ${steps === 1 ? 'move' : 'moves'}`
            : `Couldn’t reach ${end} in time`}
          {' · '}par {par}
          {leapsUsed > 0 && ` · ${leapsUsed} leap${leapsUsed === 1 ? '' : 's'}`}
        </p>

        <PathLine path={path} />

        {/* Losing used to be a dead end: zero stars, no explanation, and a replay
            of the same puzzle. Show the line they were hunting for. */}
        {!won && solution?.length > 0 && (
          <div className="modal-reveal">
            <span className="modal-reveal-label">The par line</span>
            <PathLine path={solution} />
          </div>
        )}

        <button className="submit" type="button" onClick={onReset}>
          Play again
        </button>
      </div>
    </div>
  )
}

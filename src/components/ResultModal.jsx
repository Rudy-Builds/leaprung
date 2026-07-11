import React from 'react'
import { isOneLetterDiff } from '../game/rules.js'

export function ResultModal({ status, stars, path, start, end, par, leapsUsed, onReset }) {
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

        <button className="submit" type="button" onClick={onReset}>
          Play again
        </button>
      </div>
    </div>
  )
}

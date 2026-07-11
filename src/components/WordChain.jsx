import React from 'react'
import { isOneLetterDiff } from '../game/rules.js'

// Vertical history of every word played. A step that isn't a one-letter change
// from the previous word must have been a leap, so we mark it — no need to
// thread per-step flags through state.
export function WordChain({ path, end }) {
  return (
    <ol className="chain">
      {path.map((word, i) => {
        const prev = i > 0 ? path[i - 1] : null
        const leap = prev && !isOneLetterDiff(prev, word)
        const isCurrent = i === path.length - 1
        const isEnd = word === end
        return (
          <li
            className={`chain-row ${isCurrent ? 'current' : ''} ${isEnd ? 'won' : ''}`}
            key={`${word}-${i}`}
          >
            {leap && <span className="leap-mark" title="leap">⤳</span>}
            <div className="chain-tiles">
              {word.split('').map((ch, j) => {
                const changed = prev && !leap && prev[j] !== ch
                return (
                  <span className={`tile small ${changed ? 'changed' : ''}`} key={j}>
                    {ch}
                  </span>
                )
              })}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

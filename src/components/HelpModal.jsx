import React from 'react'
import { EXAMPLE_LADDER as EXAMPLE } from '../game/example.js'

// This ladder must never be a real puzzle — see src/game/example.js. Each step
// changes exactly one letter, same as the real rules.

// Index of the letter that changed from the previous word, for highlighting.
function changedIndex(prev, word) {
  if (!prev) return -1
  for (let i = 0; i < word.length; i++) if (prev[i] !== word[i]) return i
  return -1
}

export function HelpModal({ par, moveCap, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal help"
        role="dialog"
        aria-modal="true"
        aria-label="How to play"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">How to play</h2>

        <div className="help-body">
          <p>
            {/* Same orange as the changed letters below, so the rule and the
                example read as one thing. */}
            Change <b className="hl">one letter at a time</b> to turn the start word into the
            target word. Every step has to be a real word.
          </p>

          <div className="help-example">
            {EXAMPLE.map((word, i) => {
              const hl = changedIndex(EXAMPLE[i - 1], word)
              return (
                <React.Fragment key={word}>
                  {i > 0 && <span className="arrow">→</span>}
                  <span>
                    {word.split('').map((ch, j) => (
                      <span className={j === hl ? 'hl' : ''} key={j}>
                        {ch}
                      </span>
                    ))}
                  </span>
                </React.Fragment>
              )
            })}
          </div>

          <dl className="help-terms">
            <div className="help-term">
              <dt>Par</dt>
              <dd>The fewest steps possible. This puzzle’s par is {par}.</dd>
            </div>
            <div className="help-term">
              <dt>Moves</dt>
              <dd>
                You get {moveCap}: par plus four. Run out and the puzzle locks.
              </dd>
            </div>
            {/* Nowhere else does the game say this, and it's the rule people
                collide with: there's no "play again", so losing looks broken
                unless you already knew it was one attempt. */}
            <div className="help-term">
              <dt>One a day</dt>
              <dd>
                Everyone gets the same ladder, and you get one go at it. A new one lands
                at midnight.
              </dd>
            </div>
            <div className="help-term">
              <dt>Leaps ⤳</dt>
              <dd>
                Jump straight to a <b>synonym</b> of your current word instead of
                changing a letter. A leap costs a move and a star.
              </dd>
            </div>
          </dl>

          <div className="help-stars">
            <div className="help-star-row">
              <span className="pips">★★★</span>
              <span>par, no leaps</span>
            </div>
            <div className="help-star-row">
              <span className="pips">★★</span>
              <span>one over par, or one leap</span>
            </div>
            <div className="help-star-row">
              <span className="pips">★</span>
              <span>solved before the cap</span>
            </div>
          </div>

          {/* A mailto, not bare text: on a phone an unlinked address is a
              copy-by-hand chore and the feedback never gets sent. */}
          <p className="help-feedback">
            Hope you enjoyed it! Any feedback? Just email me at{' '}
            <a href="mailto:rudybuilds@pm.me">rudybuilds@pm.me</a>
          </p>
        </div>

        <button className="submit" type="button" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}

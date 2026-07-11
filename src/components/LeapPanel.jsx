import React, { useState } from 'react'

// Shows remaining leap tokens and, when opened, a menu of synonym targets for
// the current word. Picking one spends a token and jumps there.
export function LeapPanel({ options, leapsRemaining, onLeap }) {
  const [open, setOpen] = useState(false)
  const disabled = leapsRemaining <= 0

  const pick = (word) => {
    setOpen(false)
    onLeap(word)
  }

  return (
    <div className="leap">
      <button
        className="leap-toggle"
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        ⤳ Leap
        <span className="leap-count">
          {leapsRemaining} left
        </span>
      </button>

      {open && (
        <div className="leap-menu">
          {options.length === 0 ? (
            <div className="leap-empty">No synonyms for this word.</div>
          ) : (
            options.map((word) => (
              <button className="leap-option" type="button" key={word} onClick={() => pick(word)}>
                {word}
              </button>
            ))
          )}
        </div>
      )}

      {disabled && <div className="leap-note">Out of leap tokens.</div>}
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'

// The next word as editable letter tiles. The input starts EMPTY each move so
// you can just start typing (the current word shows as a faint hint in the
// tiles). A hidden-but-focusable input captures keystrokes and stays focused —
// including right after Enter — so you never have to click back in.
export function ActiveWordTiles({ current, onSubmit, onEdit, message }) {
  const len = current.length
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(true)
  const inputRef = useRef(null)

  const focus = () => inputRef.current?.focus()

  // Fresh, empty, focused input for every new move — just type.
  useEffect(() => {
    setDraft('')
    focus()
  }, [current])

  const handleChange = (e) => {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, len)
    setDraft(cleaned)
    onEdit?.()
  }

  const submit = () => onSubmit(draft)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="active">
      <div className="active-label">Your move — just type</div>
      <div className="tile-input" onClick={focus}>
        {Array.from({ length: len }).map((_, i) => {
          const ch = draft[i] || ''
          const changed = ch && ch !== current[i]
          const isCaret = focused && i === draft.length
          return (
            <span
              className={`tile input ${changed ? 'changed' : ''} ${isCaret ? 'caret' : ''}`}
              key={i}
            >
              {ch || <span className="ghost-letter">{current[i]}</span>}
            </span>
          )
        })}
        <input
          ref={inputRef}
          className="ghost-input"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={len}
          aria-label="Next word"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          autoFocus
        />
      </div>

      <button
        className="submit"
        type="button"
        // Keep focus in the input so the next word can be typed straight away.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          submit()
          focus()
        }}
      >
        Enter
      </button>

      <div className={`message ${message ? 'show' : ''}`} role="status">
        {message || ' '}
      </div>
    </div>
  )
}

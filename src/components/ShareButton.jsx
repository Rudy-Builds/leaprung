import React, { useEffect, useRef, useState } from 'react'
import { shareText } from '../game/share.js'

/**
 * Share, with the three outcomes that actually happen on real devices:
 *   native sheet  — say nothing, the OS already gave feedback
 *   clipboard     — say "Copied!" briefly, because nothing else visibly happened
 *   neither       — hand over a selected textarea to copy by hand
 */
export function ShareButton({ text }) {
  const [state, setState] = useState('idle') // 'idle' | 'copied' | 'manual'
  const timer = useRef(null)
  const textarea = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (state === 'manual') textarea.current?.select()
  }, [state])

  const onClick = async () => {
    const result = await shareText(text)

    // 'cancelled' is a user dismissing the share sheet — a normal thing to do,
    // and rendering an error for it would be actively wrong. 'shared' needs no
    // confirmation either; the OS sheet was the confirmation.
    if (result === 'shared' || result === 'cancelled') return

    setState(result === 'copied' ? 'copied' : 'manual')
    if (result === 'copied') {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setState('idle'), 2000)
    }
  }

  return (
    <>
      <button className="submit share-btn" type="button" onClick={onClick}>
        {state === 'copied' ? 'Copied!' : 'Share'}
      </button>
      {state === 'manual' && (
        <textarea
          ref={textarea}
          className="share-manual"
          readOnly
          rows={4}
          value={text}
          aria-label="Your result — copy this"
        />
      )}
    </>
  )
}

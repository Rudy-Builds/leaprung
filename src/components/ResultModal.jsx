import React from 'react'
import { isOneLetterDiff } from '../game/rules.js'
import { buildShareText } from '../game/share.js'
import { Countdown } from './Countdown.jsx'
import { ShareButton } from './ShareButton.jsx'

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

export function ResultModal({ status, stars, path, start, end, par, leapsUsed, solution, number, streak = {}, isArchive = false, today, onPlayToday, onOpenArchive, onClose, onHelp }) {
  const won = status === 'won'
  const steps = path.length - 1

  // Note what is NOT passed: `solution`. buildShareText has no parameter for it,
  // so the par line revealed below cannot reach the clipboard. See share.js.
  const shareable = buildShareText({ number, start, end, path, par, stars, status, streak: streak.current })

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true">
        {/* This is where a confused player actually lands, especially on a
            loss — the one moment "why did that happen?" gets asked. Same
            control as the header's, so it reads as the same affordance. Moved to
            the left corner now that Close owns the conventional right corner. */}
        <button className="help-btn modal-help-btn" type="button" aria-label="How to play" onClick={onHelp}>
          ?
        </button>

        {/* Dismisses to the finished board; "See result" brings it back. */}
        <button className="help-btn modal-close-btn" type="button" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Same sticky-footer discipline as the help modal: the result scrolls,
            the actions pin. A loss adds the par-line reveal, so on a short screen
            (or an in-app browser eating height) Share would otherwise fall below
            the fold — the one action that carries the game forward. */}
        <div className="modal-body">
          <h2 className="modal-title">{won ? 'Solved!' : 'Out of moves'}</h2>
          <p className="modal-number">Leapword #{number}</p>

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

          {/* The streak: a boast on a win, a quiet sting on the loss that ends one.
              Both are the reason to come back tomorrow. `brokeStreak` is only set in
              the session where the loss actually happens — see useStreak. */}
          {won && streak.current > 0 && (
            <p className="modal-streak">🔥 {streak.current} day streak</p>
          )}
          {!won && streak.brokeStreak > 0 && (
            <p className="modal-streak broke">💔 {streak.brokeStreak} day streak ended</p>
          )}

          <PathLine path={path} />

          {/* Losing used to be a dead end: zero stars, no explanation, and a replay
              of the same puzzle. Show the line they were hunting for. */}
          {!won && solution?.length > 0 && (
            <div className="modal-reveal">
              <span className="modal-reveal-label">The par line</span>
              <PathLine path={solution} />
            </div>
          )}
        </div>

        {/* "Play again" used to live here. Under one play per day it was the
            cheat button — replaying until you got 3★ would make every shared
            score meaningless — so the daily countdown takes its place. */}
        <div className="modal-actions">
          <ShareButton text={shareable} />
          {/* On an archive play a countdown to "the next puzzle" is meaningless —
              the visitor's real daily is already out. Point them at it instead. */}
          {isArchive ? (
            <button type="button" className="submit play-today-btn" onClick={onPlayToday}>
              Play today’s Leapword #{today} →
            </button>
          ) : (
            <>
              <Countdown />
              {/* The "what next" nudge — a low-emphasis link, not a button, so it
                  never competes with Share. The archive's real home is the header
                  icon; this just catches the post-game moment. */}
              <button type="button" className="archive-link" onClick={onOpenArchive}>
                Past puzzles →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

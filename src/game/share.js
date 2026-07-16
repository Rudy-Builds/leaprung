// The share card.
//
// SPOILER GUARD, and why this is its own module: buildShareText has no parameter
// for `solution`. It takes `path` — the player's own moves, which they watched
// themselves make. It is therefore not *possible* to leak the par line through
// it. Inline in ResultModal, `puzzle.solution` is in scope and one careless edit
// away from being interpolated into a string that gets pasted into a group chat.
// The type signature is the guarantee; a comment saying "don't leak" is not.
//
// Everything printed here is already public before you play: the puzzle number,
// the start and end words (PuzzleHeader shows them), and par (ditto). The tile
// row adds only your own move count and where you leapt.

import { isOneLetterDiff } from './rules.js'

export const SHARE_URL = 'https://leaprung.rudydogum.com'

// Real emoji, not the site's ★/⤳/· glyphs. Those are typographically nicer but
// paste into Slack and iMessage as thin monochrome characters — the colour is
// the entire reason a Wordle grid travels.
const SWAP_TILE = '🟩'
const LEAP_TILE = '🟪'
const STAR = '⭐'
const NO_STAR = '☆'

/**
 * One tile per move: 🟩 letter-swap, 🟪 leap.
 *
 * Leaps are re-derived rather than read from a flag, because no per-step leap
 * flag is persisted anywhere — WordChain and ResultModal's PathLine already do
 * exactly this. A leap is simply a step that isn't a one-letter change.
 */
export function buildTileRow(path) {
  let row = ''
  for (let i = 1; i < path.length; i++) {
    row += isOneLetterDiff(path[i - 1], path[i]) ? SWAP_TILE : LEAP_TILE
  }
  return row
}

/**
 * @param {object} r
 * @param {number} r.number  puzzle number
 * @param {string} r.start
 * @param {string} r.end
 * @param {string[]} r.path  the player's own ladder
 * @param {number} r.par
 * @param {number} r.stars   0-3
 * @param {'won'|'lost'} r.status
 */
export function buildShareText({ number, start, end, path, par, stars, status }) {
  const won = status === 'won'
  const steps = path.length - 1

  // A loss shows three hollow stars rather than a fake completion — "☆☆☆" reads
  // as a score of zero, where "✖" reads as an error.
  const score = won ? STAR.repeat(stars) : NO_STAR.repeat(3)
  const summary = won
    ? `${start} → ${end} in ${steps} · par ${par}`
    : `${start} → ${end} · par ${par}`

  return [`Leaprung #${number} ${score}`, summary, buildTileRow(path), SHARE_URL].join('\n')
}

/**
 * Put `text` wherever the platform puts things.
 *
 * Returns 'shared' | 'cancelled' | 'copied' | 'manual'. Never throws: the caller
 * renders a textarea on 'manual' and, importantly, renders *nothing* on
 * 'cancelled' — dismissing a share sheet is a normal thing to do, not an error.
 */
export async function shareText(text) {
  // Desktop Chrome and Edge expose navigator.share but hand you a clumsy OS
  // dialog, when Ctrl-V into Discord is what people actually want. Touch only.
  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (navigator.canShare?.({ text }) ?? true) &&
    window.matchMedia?.('(pointer: coarse)').matches

  if (canNativeShare) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
      // Anything else (share unsupported for this payload, permission policy)
      // falls through to the clipboard rather than dead-ending.
    }
  }

  try {
    // Undefined outside a secure context — notably on http://<lan-ip>:5173, so
    // the 'manual' path below is the one you hit when testing on a real phone
    // over the LAN. It is not dead code.
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'manual'
  }
}

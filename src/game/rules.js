// Pure game logic. No React, no I/O — trivially unit-testable.
// The client needs only these primitives at runtime: a word-validity Set and a
// one-letter-diff check. No ladder graph or BFS ships to the browser.

/** Is `word` a real dictionary word? */
export function isValidWord(word, dictSet) {
  return dictSet.has(word)
}

/** True when a and b are the same length and differ in exactly one position. */
export function isOneLetterDiff(a, b) {
  if (a.length !== b.length) return false
  let diffs = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs++
    if (diffs > 1) return false
  }
  return diffs === 1
}

/**
 * Validate a proposed move. A move is legal when the candidate is a real word,
 * hasn't already been used in the path, and is either a single-letter change
 * from the current word OR one of the offered leap targets.
 *
 * Returns { ok: boolean, reason?: string, isLeap?: boolean }.
 */
export function isLegalMove(nextWord, { current, path, dictSet, leapTargets = [] }) {
  if (!nextWord || nextWord.length !== current.length) {
    return { ok: false, reason: `Enter a ${current.length}-letter word.` }
  }
  if (nextWord === current) {
    return { ok: false, reason: 'That’s the same word.' }
  }
  if (path.includes(nextWord)) {
    return { ok: false, reason: 'You’ve already used that word.' }
  }
  const isLeap = leapTargets.includes(nextWord)
  if (!isLeap && !isOneLetterDiff(current, nextWord)) {
    return { ok: false, reason: 'Change exactly one letter.' }
  }
  if (!isValidWord(nextWord, dictSet)) {
    return { ok: false, reason: 'Not in the word list.' }
  }
  return { ok: true, isLeap }
}

/**
 * Star score from the doc's scoring table.
 *  - steps: number of moves taken to reach END (letter-swaps + leaps).
 *  - par: optimal step count.
 *  - leapsUsed: how many leap tokens were spent.
 *  - solvedWithinCap: reached END without exceeding the move cap.
 *
 *  3 ★ — steps == par and no leaps
 *  2 ★ — steps <= par+1, or exactly one leap used
 *  1 ★ — solved within the cap by any means
 *  0 ★ — cap exceeded (unsolved)
 */
export function computeStars({ steps, par, leapsUsed, solvedWithinCap }) {
  if (!solvedWithinCap) return 0
  if (steps === par && leapsUsed === 0) return 3
  if (steps <= par + 1 || leapsUsed === 1) return 2
  return 1
}

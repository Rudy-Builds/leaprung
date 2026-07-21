// The completion log: which puzzles you've solved, and how well.
//
// A map of puzzle number -> best stars (0-3). Presence of a key means "attempted"
// (a recorded 0 is a loss); an absent key is "never played". Client-only, like
// the streak — it's the personal history the archive reads to show your results,
// not something the server knows. See [[storage.js]] for persistence.

/**
 * Fold a result into the log, keeping the BEST star. Pure and idempotent.
 *
 * Best-wins matters because archive plays can be retried freely (they're
 * ephemeral — a refresh restarts them), and a retry must never downgrade a record
 * you already earned. A result that doesn't improve on what's stored returns the
 * input unchanged (same reference), which lets callers skip a redundant write.
 *
 * @param {Record<number, number>} prev
 * @param {number} number  puzzle number
 * @param {number} stars   0-3 (0 = solved-not, i.e. a loss)
 */
export function mergeCompletion(prev, number, stars) {
  if (!Number.isInteger(number) || number <= 0) return prev
  const s = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)))
  if (number in prev && prev[number] >= s) return prev // no improvement — nothing to write
  return { ...prev, [number]: s }
}

// Today's progress, persisted so the daily is one play.
//
// We save on EVERY move, not just on win/loss. Saving only the final result
// would make a mid-game refresh a free retry, which is the most obvious cheat
// available and would make one-play-per-day unenforceable — and therefore make a
// shared score meaningless.
//
// None of this is tamper-proof. A cleared localStorage or a fresh browser is a
// new attempt and there is no way to stop that without a backend. That's fine:
// cheating costs you a star nobody is checking.

const KEY = 'leaprung:v1:progress'
const VERSION = 1

/**
 * Every access is wrapped. localStorage throws in Safari private mode, under
 * quota pressure, and when a browser blocks third-party storage — and a storage
 * exception must never white-screen a word game. On failure we return null and
 * the session simply lives in memory for the day.
 */
function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const defaultStorage = {
  /** Saved state for day `n`, or null for a fresh play. */
  load(n) {
    const saved = read()
    if (!saved) return null
    // A shape we no longer understand is discarded, never migrated.
    if (saved.v !== VERSION) return null
    // Yesterday's game is not today's game.
    if (saved.n !== n) return null
    return saved
  },

  save(n, state) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          v: VERSION,
          n,
          // Exactly enough to re-render ResultModal AND rebuild the share text.
          // `current` is omitted: it's always path.at(-1).
          status: state.status,
          path: state.path,
          movesUsed: state.movesUsed,
          leapsUsed: state.leapsUsed,
          leapsRemaining: state.leapsRemaining,
          stars: state.stars,
          finishedAt: state.status === 'playing' ? null : Date.now(),
        }),
      )
    } catch {
      // Degrade to in-memory. Nothing to do and nothing worth telling the user.
    }
  },

  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* no-op */
    }
  },
}

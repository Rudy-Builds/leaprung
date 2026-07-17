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

const KEY = 'leapword:v1:progress'
// Its own key, not a field on the progress payload: that one is day-scoped and
// overwritten every midnight, so a flag stored in it would forget the player has
// ever seen the help and re-open it every morning.
const HELP_SEEN_KEY = 'leapword:v1:help-seen'
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

/**
 * Whether the player has ever dismissed the help. Kept out of `defaultStorage`
 * because that object is injected into useGame as the game-progress store, and
 * this isn't game progress.
 *
 * Throws read as false, so blocked storage shows the help every visit rather
 * than never — annoying beats a player who never learns the rules.
 */
export function hasSeenHelp() {
  try {
    return localStorage.getItem(HELP_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markHelpSeen() {
  try {
    localStorage.setItem(HELP_SEEN_KEY, '1')
  } catch {
    /* no-op */
  }
}

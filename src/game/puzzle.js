// A puzzle, hydrated from one line of the daily schedule.
//
// The schedule (public/schedule/4.json) stores each puzzle as its path and
// nothing else — "KIND FIND FINE FIVE GIVE". Everything else is derivable, so
// storing it would just be a chance to disagree with itself:
//
//   start === path[0]         end === path.at(-1)
//   par   === path.length-1   solution IS the path
//
// The generator guarantees par is a TRUE optimum: the shortest route on the full
// typeable dictionary is exactly as short as this common-words-only route, so
// nobody can beat par by knowing an obscure word. See scripts/build-schedule.mjs.

/** The only word length the app ships today. The schedule declares its own. */
export const WORD_LEN = 4

/**
 * @param {string} line  space-separated path, e.g. "KIND FIND FINE FIVE GIVE"
 * @param {{leaps: number}} schedule  file-level constants
 */
export function puzzleFromPath(line, { leaps }) {
  const path = line.split(' ')
  return {
    wordLength: path[0].length,
    start: path[0],
    end: path[path.length - 1],
    par: path.length - 1,
    leaps, // leap tokens available
    // Revealed on a loss, so it has to be real data rather than a comment.
    solution: path,
  }
}

// Move cap = par + 4 (streak-breaking threshold from the design doc).
export const moveCapFor = (par) => par + 4

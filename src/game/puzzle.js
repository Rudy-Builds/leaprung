// The single hand-authored puzzle for the playable slice.
// 4-letter for now (5-letter proved too hard for a default); difficulty modes
// come later. Chosen from public/puzzle-candidates-4.json, where the generator
// guarantees par is a TRUE optimum: the shortest route on the full typeable
// dictionary is exactly as short as this common-words-only route, so nobody can
// beat par by knowing an obscure word.
//   3-star line: SAVE · GAVE · GIVE · LIVE · LIFE   (par 4, 0 leaps)
// Later this comes from /api/puzzle/today; for now it's static config.

export const PUZZLE = {
  wordLength: 4,
  start: 'SAVE',
  end: 'LIFE',
  par: 4,
  leaps: 2, // leap tokens available
}

// Move cap = par + 4 (streak-breaking threshold from the design doc).
export const moveCapFor = (par) => par + 4

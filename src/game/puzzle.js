// The single hand-authored puzzle for the playable slice.
// 4-letter for now (5-letter proved too hard for a default); difficulty modes
// come later. Verified against public/dict/4.json via BFS in build-assets.mjs:
//   3-star line: HAVE · SAVE · SAME · SOME · HOME   (par 4, 0 leaps)
//   2-star line: HAVE ·⤳HOLD · HOLE · HOME          (1 leap, 3 moves)
// Later this comes from /api/puzzle/today; for now it's static config.

export const PUZZLE = {
  wordLength: 4,
  start: 'HAVE',
  end: 'HOME',
  par: 4,
  leaps: 2, // leap tokens available
}

// Move cap = par + 4 (streak-breaking threshold from the design doc).
export const moveCapFor = (par) => par + 4

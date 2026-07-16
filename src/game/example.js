// The ladder shown in the "How to play" modal.
//
// It lives here, in plain JS away from the React component, so that
// scripts/build-schedule.mjs can import it without pulling in React — the
// generator asserts this pair is never scheduled as a real puzzle.
//
// That assertion is the whole point: the help modal shows this ladder complete,
// with every intermediate word. If it ever became day N's puzzle, the help
// button would be a "reveal answer" button.
export const EXAMPLE_LADDER = ['COLD', 'CORD', 'CARD', 'WARD', 'WARM']

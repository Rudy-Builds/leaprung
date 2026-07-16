# Leaprung — playable slice

A daily word-ladder puzzle: transform START → END one letter at a time, with limited
"leap" jumps to a synonym when you're stuck. This is the **first playable slice** — one
hand-authored puzzle, fully client-side, proving the core loop is fun before the
generation pipeline / backend / cron get built. See `../lineage-game-plan.md` for the
full product design.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Rebuild assets (optional)

Regenerates the bundled dictionary + synonym map from source. Needs network (fetches a
common-word list and calls the free Datamuse API). Pass a word length (default 4):

```bash
npm run build:assets       # 4-letter (current slice)
node scripts/build-assets.mjs 5   # or any length 3–6
```

Outputs `public/dict/<len>.json`, `public/syn/<len>.json`, and
`public/puzzle-candidates-<len>.json`.

## How it's wired

- **`src/game/rules.js`** — pure game logic (word validity, one-letter-diff, legal-move
  check, star scoring). The runtime client needs only a word `Set` + a char-diff check;
  no ladder graph or BFS ships to the browser.
- **`src/game/synonyms.js`** — leap targets from the bundled synonym map (design decision:
  synonyms ship with the game, so leaps work offline from any word and never leak the
  solution).
- **`src/game/puzzle.js`** — the single hand-authored puzzle (`KIND → GIVE`, par 4,
  4-letter for now; difficulty modes come later).
- **`src/state/useGame.js`** — reducer holding path / moves / leaps / status.
- **`src/components/`** — header, word chain, editable tiles, leap panel, result modal.
- **`scripts/build-assets.mjs`** — offline asset builder; a small-scale rehearsal of the
  full §3 generation pipeline.

## Deferred (next milestones)

Supabase + anonymous auth, streak/progress persistence, the pooled generation pipeline
(`puzzle_pool` → nightly `daily_puzzles`), Vercel cron, multi-length rotation, and the
share card. All described in the design doc.

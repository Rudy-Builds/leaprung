# Leaprung

A daily word-ladder puzzle: transform START → END one letter at a time, with limited
"leap" jumps to a synonym when you're stuck. Fully client-side and static — no backend.
See `../lineage-game-plan.md` for the full product design.

One play per day, persisted to `localStorage`; solving gives you a Wordle-style share
card. The daily rotation runs off a committed 6000-day schedule (~16 years).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pure unit tests (share text, day maths)
```

## Rebuild assets (optional)

```bash
npm run build:schedule     # public/schedule/4.json — fast, 2 fetches + BFS
npm run build:assets       # public/dict/4.json + public/syn/4.json — slow Datamuse sweep
npm run build:icons        # public/og.png + apple-touch-icon.png (needs Chrome)
```

All take a word length (default 4), e.g. `node scripts/build-schedule.mjs 5`.

**The schedule is a committed artifact, not a build output.** Puzzle #42 has to mean the
same thing forever — someone shared their score for it. So `build-schedule` is
append-only by default (`--extend`); it refuses to rewrite history without
`--rebuild --force`. Use `--dry-run` to see the stats without writing.

## How it's wired

- **`src/game/rules.js`** — pure game logic (word validity, one-letter-diff, legal-move
  check, star scoring). The runtime client needs only a word `Set` + a char-diff check;
  no ladder graph or BFS ships to the browser.
- **`src/game/synonyms.js`** — leap targets from the bundled synonym map (design decision:
  synonyms ship with the game, so leaps work offline from any word and never leak the
  solution).
- **`src/game/puzzle.js`** — hydrates a puzzle from one schedule line. `start`, `end`,
  `par` and `solution` are all derived from the path, so they can't disagree with it.
- **`src/game/daily.js`** — which puzzle is today. Local midnight (like Wordle) so the
  countdown reads true against the player's own clock.
- **`src/game/share.js`** — the share card. Note it takes no `solution` parameter: that
  signature is what makes leaking the par line impossible, not a comment.
- **`src/state/useGame.js`** — reducer holding path / moves / leaps / status.
- **`src/state/storage.js`** — today's progress. Saves every move, not just the result —
  otherwise a mid-game refresh is a free retry.
- **`src/components/`** — header, word chain, editable tiles, leap panel, result modal.
- **`scripts/blocklist.mjs`** — words a puzzle may not use. Gates start/end and leap
  options only; interiors and typing are untouched, which keeps par a true optimum.
- **`scripts/build-schedule.mjs`** — candidate search + the daily schedule.
- **`scripts/build-assets.mjs`** — dictionary + synonym map.

## Deferred (next milestones)

Supabase + anonymous auth, streaks, cross-device sync, and multi-length rotation. All
described in the design doc.

## Data sources

- **[ENABLE](https://github.com/dolph/dictionary)** — the word list (`public/dict/`).
  Public domain, by Alan Beale.
- **[FrequencyWords](https://github.com/hermitdave/FrequencyWords)** (MIT) — OpenSubtitles
  frequency ranks, used at build time only to derive the common-word tier.
- **[Datamuse API](https://www.datamuse.com/api/)** — synonyms for leaps (`public/syn/`),
  fetched offline at build time. Free for commercial and non-commercial use.

## License

Copyright (C) 2026 Rudy-Builds.

Licensed under the **GNU Affero General Public License v3.0 or later** — see [LICENSE](LICENSE).
In short: you're free to use, modify and share this, but if you run a modified version as a
network service, you must make your source available under the same terms.

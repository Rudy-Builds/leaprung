// Offline asset builder for Leaprung.
//
// Produces:
//   public/dict/<len>.json  — the VALIDITY list: every word you're allowed to type
//   public/syn/<len>.json   — { WORD: [SYN, ...] } bundled synonyms for leaps
//
// The daily schedule is built separately by scripts/build-schedule.mjs — it only
// needs the two word-list fetches, while this script's Datamuse sweep takes a
// slow unattended pass over every valid word. Keeping them apart means you can
// rebuild the schedule in seconds without re-scraping synonyms.
//
// Vocabulary tiers and their sources are documented in scripts/lib/words.mjs.
// Synonyms come from Datamuse rel_syn, same-length and in-validity-dict only.
// No external deps — Node 18+ global fetch.
//
// Usage: node scripts/build-assets.mjs 4

import { BLOCKED, cleanSynMap } from './blocklist.mjs'
import { loadVocab, write } from './lib/words.mjs'

const WORD_LEN = Number(process.argv[2]) || 4
if (WORD_LEN < 3 || WORD_LEN > 6) throw new Error(`unsupported word length: ${WORD_LEN}`)

console.log(`building ${WORD_LEN}-letter assets`)

const { validWords, validSet } = await loadVocab(WORD_LEN)

// Never filtered by the blocklist: this is the tier par is measured on, and the
// tier the player may type from. If it's a real word, it counts.
await write(`public/dict/${WORD_LEN}.json`, validWords)

// ---------------------------------------------------------------------------
// Synonyms for leaps.
// ---------------------------------------------------------------------------
console.log('\nfetching synonyms from Datamuse…')
const synMap = {}
let done = 0

const fetchSyn = async (word) => {
  // A leap button is the game putting a word in your mouth, so blocked words are
  // gated here as both key and target. Unfiltered, Datamuse hands back live
  // entries like TOOL→DICK, BLUE→SEXY and BULL→CRAP on very ordinary words.
  if (BLOCKED.has(word)) return

  const url = `https://api.datamuse.com/words?rel_syn=${word.toLowerCase()}&max=25`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 6000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
        continue
      }
      const arr = await res.json()
      const syns = []
      for (const { word: w } of arr) {
        const up = String(w).toUpperCase()
        if (up.length !== WORD_LEN || up === word || !validSet.has(up)) continue
        if (BLOCKED.has(up)) continue
        if (!syns.includes(up)) syns.push(up)
        if (syns.length >= 3) break
      }
      if (syns.length) synMap[word] = syns
      return
    } catch {
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
    }
  }
}

const CONCURRENCY = 12
let idx = 0
const worker = async () => {
  while (idx < validWords.length) {
    const w = validWords[idx++]
    await fetchSyn(w)
    if (++done % 400 === 0) console.log(`  synonyms: ${done}/${validWords.length}`)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

// Belt and braces: fetchSyn already gates, but the map is the thing that ships,
// so it gets the same guarantee applied to it as a whole.
await write(`public/syn/${WORD_LEN}.json`, cleanSynMap(synMap))
console.log(`\ndone — ${Object.keys(synMap).length} words have leap synonyms`)

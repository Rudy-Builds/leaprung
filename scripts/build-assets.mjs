// Offline asset builder for Leaprung.
//
// Produces:
//   public/dict/<len>.json  — the VALIDITY list: every word you're allowed to type
//   public/syn/<len>.json   — { WORD: [SYN, ...] } bundled synonyms for leaps
//   public/puzzle-candidates-<len>.json — par-verified START/END pairs to pick from
//
// Two tiers of vocabulary, doing two different jobs:
//
//   VALIDITY (broad, ~3k 4-letter words) — what the player may type. Generous, so
//     ordinary words like HIVE/CROW/FERN never bounce. par is measured on THIS
//     graph, so par is a true optimum nobody can beat.
//   COMMON (strict, ~1.3k) — what a puzzle path may route through. A pair only
//     becomes a candidate if its shortest COMMON route is exactly as short as the
//     true optimum, so par is always reachable using only everyday words.
//
// Sources: a real-word dictionary ∩ an OpenSubtitles frequency list. The
// intersection keeps Scrabble-isms (ETUI, ABAC, OXES) out while keeping real
// everyday words in. No external deps — Node 18+ global fetch.
//
// Usage: node scripts/build-assets.mjs 4

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WORD_LEN = Number(process.argv[2]) || 4
if (WORD_LEN < 3 || WORD_LEN > 6) throw new Error(`unsupported word length: ${WORD_LEN}`)

const VALID_CUT = 50000 // frequency rank cutoff for "you may type this"
const COMMON_CUT = 10000 // stricter cutoff for "a puzzle may route through this"
const PAR_MIN = 4
const PAR_MAX = 6
const START_POOL = 400 // how many common words to try as puzzle starts

const REAL_WORDS_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'
const FREQ_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt'

const write = async (relPath, data) => {
  const full = resolve(ROOT, relPath)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, JSON.stringify(data))
  const n = Array.isArray(data) ? data.length : Object.keys(data).length
  console.log(`wrote ${relPath} (${n} entries)`)
}

console.log(`building ${WORD_LEN}-letter assets`)

// ---------------------------------------------------------------------------
// 1. Vocabulary tiers: real words ∩ frequency rank.
// ---------------------------------------------------------------------------
console.log('fetching word list + frequency list…')
const [realRaw, freqRaw] = await Promise.all([
  fetch(REAL_WORDS_URL).then((r) => r.text()),
  fetch(FREQ_URL).then((r) => r.text()),
])

const real = new Set()
for (const line of realRaw.split('\n')) {
  const w = line.trim().toUpperCase()
  if (w.length === WORD_LEN && /^[A-Z]+$/.test(w)) real.add(w)
}

const rank = new Map()
freqRaw.split('\n').forEach((line, i) => {
  const w = line.split(' ')[0]?.trim().toUpperCase()
  if (w && !rank.has(w)) rank.set(w, i)
})

const rankOf = (w) => rank.get(w) ?? Infinity
const byRank = (a, b) => rankOf(a) - rankOf(b)

const validWords = [...real].filter((w) => rankOf(w) < VALID_CUT).sort(byRank)
const commonWords = validWords.filter((w) => rankOf(w) < COMMON_CUT)

console.log(`  validity: ${validWords.length} words (typeable)`)
console.log(`  common:   ${commonWords.length} words (puzzle paths route through these)`)
await write(`public/dict/${WORD_LEN}.json`, validWords)

const validSet = new Set(validWords)

// ---------------------------------------------------------------------------
// 2. Letter-ladder graphs (wildcard buckets, O(n)) + BFS.
// ---------------------------------------------------------------------------
const makeNeighbors = (words) => {
  const buckets = new Map()
  for (const w of words) {
    for (let i = 0; i < WORD_LEN; i++) {
      const pat = w.slice(0, i) + '*' + w.slice(i + 1)
      if (!buckets.has(pat)) buckets.set(pat, [])
      buckets.get(pat).push(w)
    }
  }
  return (w) => {
    const out = new Set()
    for (let i = 0; i < WORD_LEN; i++) {
      const bucket = buckets.get(w.slice(0, i) + '*' + w.slice(i + 1))
      if (!bucket) continue
      for (const n of bucket) if (n !== w) out.add(n)
    }
    return out
  }
}

const bfs = (src, neighbors) => {
  const dist = new Map([[src, 0]])
  const prev = new Map()
  const q = [src]
  for (let head = 0; head < q.length; head++) {
    const w = q[head]
    for (const n of neighbors(w)) {
      if (dist.has(n)) continue
      dist.set(n, dist.get(w) + 1)
      prev.set(n, w)
      q.push(n)
    }
  }
  return { dist, prev }
}

const pathBetween = (prev, src, dst) => {
  const path = [dst]
  let cur = dst
  while (cur !== src) {
    cur = prev.get(cur)
    path.unshift(cur)
  }
  return path
}

const nbrsValid = makeNeighbors(validWords)
const nbrsCommon = makeNeighbors(commonWords)

// ---------------------------------------------------------------------------
// 3. Candidates: the common route must BE the true optimum.
// ---------------------------------------------------------------------------
console.log('searching for puzzles…')
const candidates = []
for (let s = 0; s < Math.min(START_POOL, commonWords.length); s++) {
  const src = commonWords[s]
  const { dist: distValid } = bfs(src, nbrsValid)
  const { dist: distCommon, prev: prevCommon } = bfs(src, nbrsCommon)

  for (const [dst, d] of distCommon) {
    if (d < PAR_MIN || d > PAR_MAX) continue
    // The whole point: a shortcut through some obscure word would make par a lie.
    if (distValid.get(dst) !== d) continue
    const path = pathBetween(prevCommon, src, dst)
    candidates.push({
      start: src,
      end: dst,
      par: d,
      path,
      worstRank: Math.max(...path.map(rankOf)),
    })
  }
}

candidates.sort((a, b) => {
  const pa = a.par <= 5 ? 0 : 1
  const pb = b.par <= 5 ? 0 : 1
  if (pa !== pb) return pa - pb
  return a.worstRank - b.worstRank
})

const topCandidates = []
const usedStarts = new Set()
for (const c of candidates) {
  if (usedStarts.has(c.start)) continue // one puzzle per start word, for variety
  usedStarts.add(c.start)
  topCandidates.push(c)
  if (topCandidates.length >= 25) break
}
await write(`public/puzzle-candidates-${WORD_LEN}.json`, topCandidates)
console.log(`\n${candidates.length} valid pairs found. Top candidates (par is a true optimum):`)
for (const c of topCandidates.slice(0, 12)) {
  console.log(`  ${c.start} → ${c.end}  par ${c.par}   [${c.path.join(' ')}]`)
}

// ---------------------------------------------------------------------------
// 4. Synonyms for leaps — Datamuse rel_syn, same-length & in-validity-dict only.
// ---------------------------------------------------------------------------
console.log('\nfetching synonyms from Datamuse…')
const synMap = {}
let done = 0
const fetchSyn = async (word) => {
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
await write(`public/syn/${WORD_LEN}.json`, synMap)
console.log(`\ndone — ${Object.keys(synMap).length} words have leap synonyms`)

// Offline asset builder for the Lineage playable slice.
//
// Produces:
//   public/dict/5.json  — array of common 5-letter words (frequency-ordered)
//   public/syn/5.json   — { WORD: [SYN, SYN, ...] } bundled synonyms for leaps
//   public/puzzle-candidates.json — BFS-verified START/END pairs to hand-pick from
//
// This is a small-scale rehearsal of the real §3 generation pipeline, so it also
// de-risks the eventual replenish job. No external deps — Node 18+ global fetch.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Word length is configurable so we can build assets per difficulty:
//   node scripts/build-assets.mjs 4
const WORD_LEN = Number(process.argv[2]) || 5
if (WORD_LEN < 3 || WORD_LEN > 6) throw new Error(`unsupported word length: ${WORD_LEN}`)
console.log(`building ${WORD_LEN}-letter assets`)
const FREQ_LIST_URL =
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa.txt'

const write = async (relPath, data) => {
  const full = resolve(ROOT, relPath)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, JSON.stringify(data))
  console.log(`wrote ${relPath} (${Array.isArray(data) ? data.length : Object.keys(data).length} entries)`)
}

// ---------------------------------------------------------------------------
// 1. Dictionary: common words, frequency-ordered, filtered to WORD_LEN letters.
// ---------------------------------------------------------------------------
console.log('fetching frequency list…')
const raw = await fetch(FREQ_LIST_URL).then((r) => r.text())
const words = []
const seen = new Set()
for (const line of raw.split('\n')) {
  const w = line.trim().toUpperCase()
  if (w.length !== WORD_LEN) continue
  if (!/^[A-Z]+$/.test(w)) continue
  if (seen.has(w)) continue
  seen.add(w)
  words.push(w) // preserves frequency order (most common first)
}
console.log(`kept ${words.length} common ${WORD_LEN}-letter words`)
await write(`public/dict/${WORD_LEN}.json`, words)

const dictSet = new Set(words)
const rank = new Map(words.map((w, i) => [w, i])) // lower = more common

// ---------------------------------------------------------------------------
// 2. Letter-ladder graph via wildcard buckets (O(n)), then BFS for candidates.
// ---------------------------------------------------------------------------
const buckets = new Map() // pattern -> [words]
for (const w of words) {
  for (let i = 0; i < WORD_LEN; i++) {
    const pat = w.slice(0, i) + '*' + w.slice(i + 1)
    if (!buckets.has(pat)) buckets.set(pat, [])
    buckets.get(pat).push(w)
  }
}
const neighbors = (w) => {
  const out = new Set()
  for (let i = 0; i < WORD_LEN; i++) {
    const pat = w.slice(0, i) + '*' + w.slice(i + 1)
    for (const n of buckets.get(pat)) if (n !== w) out.add(n)
  }
  return out
}

// BFS returns {dist, prev} maps from a source.
const bfs = (src) => {
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

// Candidate puzzles: start from the most-common words, find ends at par 4–6 whose
// every intermediate word is also common (rank threshold), prefer common endpoints.
const START_POOL = 300 // consider the 300 most common words as starts
const COMMON_RANK = 2500 // every path word must be at least this common
const PAR_MIN = 4
const PAR_MAX = 6
const candidates = []
for (let s = 0; s < Math.min(START_POOL, words.length); s++) {
  const src = words[s]
  const { dist, prev } = bfs(src)
  for (const [dst, d] of dist) {
    if (d < PAR_MIN || d > PAR_MAX) continue
    if ((rank.get(dst) ?? Infinity) > COMMON_RANK) continue
    const path = pathBetween(prev, src, dst)
    const worst = Math.max(...path.map((w) => rank.get(w) ?? Infinity))
    if (worst > COMMON_RANK) continue // reject obscure intermediate words
    candidates.push({ start: src, end: dst, par: d, path, worstRank: worst })
  }
}
// Prefer par 4–5, then commonest overall path, then unique start words for variety.
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
console.log('\nTop puzzle candidates (start → end, par):')
for (const c of topCandidates.slice(0, 12)) {
  console.log(`  ${c.start} → ${c.end}  par ${c.par}   [${c.path.join(' ')}]`)
}

// ---------------------------------------------------------------------------
// 3. Synonyms for leaps — Datamuse rel_syn, same-length & in-dict only.
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
        if (up.length !== WORD_LEN) continue
        if (up === word) continue
        if (!dictSet.has(up)) continue
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

// Simple concurrency pool.
const CONCURRENCY = 12
let idx = 0
const worker = async () => {
  while (idx < words.length) {
    const w = words[idx++]
    await fetchSyn(w)
    if (++done % 200 === 0) console.log(`  synonyms: ${done}/${words.length}`)
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
await write(`public/syn/${WORD_LEN}.json`, synMap)
console.log(`\ndone — ${Object.keys(synMap).length} words have leap synonyms`)

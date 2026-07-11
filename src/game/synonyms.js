// Leap targets come from a bundled synonym map (design decision: Option 1).
// The map ships with the game, so leaps resolve offline from ANY word and never
// leak the solution. syn/5.json is already pre-filtered to same-length, in-dict
// synonyms at build time; here we additionally drop any word already in the path.

export function getSynonyms(word, synMap, { dictSet, path = [] } = {}) {
  const raw = synMap[word] || []
  return raw.filter(
    (s) => s.length === word.length && dictSet.has(s) && !path.includes(s)
  )
}

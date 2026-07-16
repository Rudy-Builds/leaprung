// Words a PUZZLE may not use. Build-time only — never shipped to the client.
//
// The gate is deliberately narrow, and the narrowness is load-bearing:
//
//   start / end   — BLOCKED. These are public. They sit in the header before you
//                   play, in the share text, and in anything screenshotted into a
//                   group chat. "LOVE → SHIT" is the disaster case.
//   leap options  — BLOCKED, as both key and target. A leap button is the game
//                   putting a word in your mouth; it should never offer one of
//                   these. (Today it ships TOOL→DICK, BLUE→SEXY, BULL→CRAP.)
//   interiors     — ALLOWED. Passing through a rude word on your own ladder is
//                   private, mildly funny, and nobody's business but yours.
//   typing        — ALLOWED, always. This list never touches the validity tier.
//
// Why interiors and typing stay free: `validWords` is the tier par is measured
// on. Filtering it would change distValid, inflate measured par, and silently
// break the "par is a true optimum" guarantee puzzle.js promises. Filtering
// `commonWords` (the routing tier) would drag interiors down with it for no
// gain. Gating only the start/end selection costs us ~44 of ~1139 common words
// and leaves the pool essentially untouched.
//
// This is a denylist, and denylists leak. Review new scheduled entries.

// Hate slurs. Every one of these is rarer than the common-tier cutoff, so none
// can currently reach a start/end slot — they're here for the synonym gate and
// so the list stays correct if the cutoff ever moves.
const SLURS = `
  KIKE SPIC COON GOOK WOPS FAGS DYKE DAGO MICK ABOS GYPS POMS WOGS HUNS
  NAZI JEWS HOMO JISM
`

// Profanity and scatology. SHIT(96) and FUCK(106) are among the 110 most common
// four-letter words in English, which is exactly why no frequency floor can
// filter them and only an explicit list will do.
const PROFANITY = `
  FUCK SHIT CUNT PISS TWAT ARSE CRAP TURD POOP FART PUKE SNOT BARF
`

// Sexual. BOOB and SHAG have innocent senses (a fool; a rug) but read as the
// other thing on a card someone screenshots.
const SEXUAL = `
  DICK COCK TITS SLUT ANUS ORGY BOOB SHAG PORN HUMP
`

// Sexual violence. Categorically different from the ordinary violence words
// below — there is no innocent reading.
const VIOLENCE = `
  RAPE
`

// Hard drugs only. WEED, COKE, PILL, JUNK and HIGH are deliberately absent:
// a weed is a plant, a coke is a soft drink, and blocking them would delete
// good puzzles to solve nothing.
const DRUGS = `
  METH DOPE
`

// Deliberately NOT blocked, so nobody "fixes" this later:
//
//   KILL(79) DEAD(83) DIED(160) DIES(452) SHOT(154) HANG(196) STAB(721)
//   BOMB(322) GUNS(328) AMMO(1013) MAIM GORE SLAY
//     Ordinary English. LIVE → DEAD is a genuinely good word ladder and this
//     is a word game, not a content filter.
//
//   HELL(87) DAMN(131) GODS(450)
//     Mild to the point of invisibility.
//
//   SEXY(433) LUST(816) BONE(462) LAID(456) HORN(426)
//     Innuendo at worst. A puzzle answering SEXY is fine.
//
//   JACK(191) BILL(234) MIKE(243) MARK(249) NICK(301) EARL(596) WARD(600)
//   BRAD(572) HART(1003) RAJA(1005)
//     Read as first names but are all common nouns — a jack lifts a car, a
//     hart is a male deer, a brad is a small nail, a mike is a microphone.
//     Blocking them would remove good puzzles to fix a cosmetic non-problem.

export const BLOCKED = new Set(
  [SLURS, PROFANITY, SEXUAL, VIOLENCE, DRUGS].join(' ').trim().split(/\s+/),
)

/** Filter a synonym map so no blocked word appears as a key or a target. */
export function cleanSynMap(synMap) {
  const out = {}
  for (const [word, syns] of Object.entries(synMap)) {
    if (BLOCKED.has(word)) continue
    const kept = syns.filter((s) => !BLOCKED.has(s))
    if (kept.length) out[word] = kept // drop keys left with nothing to offer
  }
  return out
}

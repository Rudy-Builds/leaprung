// node --test src/game/
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { SHARE_URL, buildShareText, buildTileRow } from './share.js'

const KIND_GIVE = ['KIND', 'FIND', 'FINE', 'FIVE', 'GIVE']

describe('buildTileRow', () => {
  test('one tile per move, not per word', () => {
    assert.equal([...buildTileRow(KIND_GIVE)].length, KIND_GIVE.length - 1)
  })

  test('letter-swaps are green', () => {
    assert.equal(buildTileRow(KIND_GIVE), '🟩🟩🟩🟩')
  })

  test('a leap — a step that is not a one-letter change — is purple', () => {
    assert.equal(buildTileRow(['KIND', 'FIND', 'SEEK', 'SEEM']), '🟩🟪🟩')
  })

  test('all-leap path', () => {
    assert.equal(buildTileRow(['KIND', 'NICE', 'GOOD']), '🟪🟪')
  })

  test('no moves yet', () => {
    assert.equal(buildTileRow(['KIND']), '')
  })
})

describe('buildShareText', () => {
  const base = { number: 42, start: 'KIND', end: 'GIVE', par: 4, path: KIND_GIVE }

  test('3 stars, par, no leaps', () => {
    assert.equal(
      buildShareText({ ...base, stars: 3, status: 'won' }),
      `Leaprung #42 ⭐⭐⭐\nKIND → GIVE in 4 · par 4\n🟩🟩🟩🟩\n${SHARE_URL}`,
    )
  })

  test('2 stars, one over par with a leap', () => {
    assert.equal(
      buildShareText({
        ...base,
        stars: 2,
        status: 'won',
        path: ['KIND', 'FIND', 'FINE', 'MINE', 'GIVE', 'GIVE'],
      }),
      `Leaprung #42 ⭐⭐\nKIND → GIVE in 5 · par 4\n🟩🟩🟩🟪🟪\n${SHARE_URL}`,
    )
  })

  test('1 star', () => {
    assert.match(buildShareText({ ...base, stars: 1, status: 'won' }), /^Leaprung #42 ⭐\n/)
  })

  test('a loss shows hollow stars and no move count — not a fake completion', () => {
    const out = buildShareText({ ...base, stars: 0, status: 'lost' })
    assert.equal(out, `Leaprung #42 ☆☆☆\nKIND → GIVE · par 4\n🟩🟩🟩🟩\n${SHARE_URL}`)
    assert.doesNotMatch(out, /in \d/)
    assert.doesNotMatch(out, /⭐/)
  })

  test('always four lines, always ends with the URL', () => {
    for (const status of ['won', 'lost']) {
      const lines = buildShareText({ ...base, stars: 2, status }).split('\n')
      assert.equal(lines.length, 4)
      assert.equal(lines[3], SHARE_URL)
    }
  })
})

describe('spoiler guard', () => {
  // The structural guarantee is that buildShareText has no `solution` parameter.
  // This asserts the consequence: nothing a player didn't already walk can leak.
  test('never leaks an interior word the player did not visit', () => {
    const solution = ['STOP', 'SHOP', 'SHIP', 'SHIT', 'SUIT', 'QUIT']
    const playerPath = ['STOP', 'SLOP', 'SLIP', 'SLIT', 'SUIT', 'QUIT']

    const out = buildShareText({
      number: 12,
      start: 'STOP',
      end: 'QUIT',
      par: 5,
      path: playerPath,
      stars: 3,
      status: 'won',
    })

    for (const word of solution.slice(1, -1)) {
      if (playerPath.includes(word)) continue
      assert.ok(!out.includes(word), `leaked par-line word ${word}`)
    }
    assert.ok(!out.includes('SHIT'))
  })

  test('does not print the player’s own interiors either — only tiles', () => {
    const out = buildShareText({
      number: 1,
      start: 'KIND',
      end: 'GIVE',
      par: 4,
      path: KIND_GIVE,
      stars: 3,
      status: 'won',
    })
    for (const interior of KIND_GIVE.slice(1, -1)) {
      assert.ok(!out.includes(interior), `leaked own interior ${interior}`)
    }
  })
})

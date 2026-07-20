// node --test src/game/
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { DEFAULT_STREAK, nextStreak } from './streak.js'

describe('nextStreak', () => {
  test('first win starts a streak of 1', () => {
    const s = nextStreak(null, { day: 1, won: true })
    assert.equal(s.current, 1)
    assert.equal(s.max, 1)
    assert.equal(s.lastDay, 1)
    assert.equal(s.played, 1)
    assert.equal(s.wins, 1)
  })

  test('first loss counts as a game played, with no streak', () => {
    const s = nextStreak(null, { day: 1, won: false })
    assert.equal(s.current, 0)
    assert.equal(s.lastDay, 1)
    assert.equal(s.played, 1)
    assert.equal(s.wins, 0)
  })

  test('consecutive wins extend the streak', () => {
    let s = nextStreak(null, { day: 1, won: true })
    s = nextStreak(s, { day: 2, won: true })
    s = nextStreak(s, { day: 3, won: true })
    assert.equal(s.current, 3)
    assert.equal(s.max, 3)
    assert.equal(s.wins, 3)
  })

  test('a loss resets the streak to zero but remembers the best', () => {
    let s = nextStreak(null, { day: 1, won: true })
    s = nextStreak(s, { day: 2, won: true }) // current 2
    s = nextStreak(s, { day: 3, won: false })
    assert.equal(s.current, 0)
    assert.equal(s.max, 2, 'best yet is preserved through a loss')
    assert.equal(s.played, 3)
    assert.equal(s.wins, 2)
  })

  test('a missed day breaks the streak even on a win', () => {
    let s = nextStreak(null, { day: 1, won: true })
    s = nextStreak(s, { day: 2, won: true }) // current 2
    s = nextStreak(s, { day: 4, won: true }) // day 3 was skipped
    assert.equal(s.current, 1, 'starts over at 1, not 3')
    assert.equal(s.max, 2)
    assert.equal(s.wins, 3)
  })

  test('recording the same day twice is a no-op, same reference', () => {
    const once = nextStreak(null, { day: 5, won: true })
    const twice = nextStreak(once, { day: 5, won: true })
    assert.equal(twice, once, 'lets callers skip a redundant write')
  })

  test('a past day never rewrites a streak built on later days', () => {
    const s = nextStreak(null, { day: 10, won: true })
    assert.equal(nextStreak(s, { day: 3, won: false }), s)
    assert.equal(nextStreak(s, { day: 3, won: true }), s)
  })

  test('does not mutate its input or the frozen default', () => {
    const snapshot = { ...DEFAULT_STREAK }
    nextStreak(DEFAULT_STREAK, { day: 1, won: true })
    assert.deepEqual({ ...DEFAULT_STREAK }, snapshot)
  })
})

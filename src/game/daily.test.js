// Must run under a DST-observing timezone to be meaningful:
//   TZ=America/New_York node --test src/game/
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { dayNumber, formatCountdown, msUntilNextPuzzle, puzzleForDay } from './daily.js'

const at = (y, m, d, h = 12) => new Date(y, m, d, h)

describe('dayNumber', () => {
  test('the epoch is #1', () => {
    assert.equal(dayNumber(at(2026, 6, 16)), 1)
  })

  test('counts forward', () => {
    assert.equal(dayNumber(at(2026, 6, 17)), 2)
    assert.equal(dayNumber(at(2026, 7, 15)), 31)
  })

  test('is stable across the whole local day', () => {
    const hours = [0, 1, 6, 12, 18, 23]
    const ns = hours.map((h) => dayNumber(at(2026, 6, 20, h)))
    assert.deepEqual(new Set(ns), new Set([5]))
  })

  test('before the epoch goes <= 0 rather than throwing', () => {
    assert.equal(dayNumber(at(2026, 6, 15)), 0)
    assert.ok(dayNumber(at(2020, 0, 1)) < 0)
  })

  // The reason dayNumber routes local Y/M/D through Date.UTC instead of diffing
  // two local Dates: across a DST boundary a local day is 23 or 25 hours, so a
  // naive diff/86400000 lands on x.958 or x.041 and floor() skips or repeats a
  // puzzle. These would fail on the naive implementation.
  describe('DST', () => {
    test('fall back — 25-hour day (US, 2026-11-01)', () => {
      const oct31 = dayNumber(at(2026, 9, 31))
      assert.equal(dayNumber(at(2026, 10, 1)), oct31 + 1)
      assert.equal(dayNumber(at(2026, 10, 2)), oct31 + 2)
    })

    test('spring forward — 23-hour day (US, 2026-03-08)', () => {
      const mar7 = dayNumber(at(2026, 2, 7))
      assert.equal(dayNumber(at(2026, 2, 8)), mar7 + 1)
      assert.equal(dayNumber(at(2026, 2, 9)), mar7 + 2)
    })

    test('no day is skipped or repeated across a whole year', () => {
      const seen = []
      for (let d = new Date(2026, 6, 16); d < new Date(2027, 6, 16); d.setDate(d.getDate() + 1)) {
        seen.push(dayNumber(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)))
      }
      const expected = seen.map((_, i) => i + 1)
      assert.deepEqual(seen, expected)
    })
  })
})

describe('msUntilNextPuzzle', () => {
  test('always in (0, 25h] — never negative, never lies', () => {
    for (const d of [at(2026, 10, 1, 0), at(2026, 10, 1, 23), at(2026, 2, 8, 3)]) {
      const ms = msUntilNextPuzzle(d)
      assert.ok(ms > 0, `${d} gave ${ms}`)
      assert.ok(ms <= 25 * 3600_000)
    }
  })
})

describe('formatCountdown', () => {
  test('shrinks its shape as it closes in', () => {
    assert.equal(formatCountdown(6 * 3600_000 + 12 * 60_000), '6h 12m')
    assert.equal(formatCountdown(12 * 60_000), '12m')
    assert.equal(formatCountdown(48_000), '48s')
    assert.equal(formatCountdown(0), '0s')
  })

  test('clamps negatives rather than rendering "-1s"', () => {
    assert.equal(formatCountdown(-5000), '0s')
  })
})

describe('puzzleForDay', () => {
  const schedule = {
    leaps: 2,
    paths: ['KIND FIND FINE FIVE GIVE', 'WAIT WANT WENT SENT SEND', 'COOL FOOL FOOD GOOD GOLD'],
  }

  test('day 1 is the first path', () => {
    const p = puzzleForDay(1, schedule)
    assert.equal(p.start, 'KIND')
    assert.equal(p.end, 'GIVE')
    assert.equal(p.par, 4)
    assert.equal(p.leaps, 2)
    assert.deepEqual(p.solution, ['KIND', 'FIND', 'FINE', 'FIVE', 'GIVE'])
  })

  test('wraps past the end instead of returning undefined', () => {
    assert.equal(puzzleForDay(4, schedule).start, 'KIND')
    assert.equal(puzzleForDay(3001, schedule).start, 'KIND')
  })

  test('a clock set before the epoch still returns a puzzle', () => {
    for (const n of [0, -1, -7, -1000]) {
      assert.ok(puzzleForDay(n, schedule).start, `n=${n} produced nothing`)
    }
  })

  test('par is always path length minus one', () => {
    for (let n = 1; n <= 6; n++) {
      const p = puzzleForDay(n, schedule)
      assert.equal(p.par, p.solution.length - 1)
      assert.equal(p.start, p.solution[0])
      assert.equal(p.end, p.solution.at(-1))
    }
  })
})

// node --test src/**/*.test.js
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { mergeCompletion } from './completions.js'

describe('mergeCompletion', () => {
  test('records a first result', () => {
    assert.deepEqual(mergeCompletion({}, 3, 2), { 3: 2 })
  })

  test('a loss is recorded as an attempt (0), distinct from unplayed', () => {
    const log = mergeCompletion({}, 5, 0)
    assert.deepEqual(log, { 5: 0 })
    assert.ok(5 in log, 'present means attempted')
    assert.ok(!(4 in log), 'absent means never played')
  })

  test('keeps the best star — a better retry upgrades', () => {
    assert.deepEqual(mergeCompletion({ 3: 1 }, 3, 3), { 3: 3 })
  })

  test('keeps the best star — a worse retry does not downgrade', () => {
    const prev = { 3: 3 }
    assert.equal(mergeCompletion(prev, 3, 0), prev, 'unchanged, same reference')
    assert.equal(mergeCompletion(prev, 3, 2), prev)
  })

  test('an equal result is a no-op (same reference), so callers skip the write', () => {
    const prev = { 3: 2 }
    assert.equal(mergeCompletion(prev, 3, 2), prev)
  })

  test('clamps out-of-range stars', () => {
    assert.deepEqual(mergeCompletion({}, 1, 9), { 1: 3 })
    assert.deepEqual(mergeCompletion({}, 1, -4), { 1: 0 })
  })

  test('ignores a non-positive or non-integer puzzle number', () => {
    assert.deepEqual(mergeCompletion({}, 0, 3), {})
    assert.deepEqual(mergeCompletion({}, -2, 3), {})
    assert.deepEqual(mergeCompletion({}, 1.5, 3), {})
  })

  test('does not mutate the input', () => {
    const prev = { 1: 1 }
    mergeCompletion(prev, 2, 3)
    assert.deepEqual(prev, { 1: 1 })
  })
})

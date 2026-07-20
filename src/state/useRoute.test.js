// node --test src/**/*.test.js
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { dayFromPath } from './useRoute.js'

describe('dayFromPath', () => {
  test('the root is no request — show today', () => {
    assert.equal(dayFromPath('/'), null)
    assert.equal(dayFromPath(''), null)
  })

  test('a bare number names that puzzle', () => {
    assert.equal(dayFromPath('/5'), 5)
    assert.equal(dayFromPath('/142'), 142)
  })

  test('a trailing slash is tolerated', () => {
    assert.equal(dayFromPath('/5/'), 5)
  })

  test('junk and non-numeric paths fall back to today', () => {
    for (const p of ['/abc', '/5x', '/5/6', '/day/5', '/-1', '/ 5']) {
      assert.equal(dayFromPath(p), null, `${p} should be null`)
    }
  })

  test('zero is not a valid puzzle', () => {
    assert.equal(dayFromPath('/0'), null)
  })
})

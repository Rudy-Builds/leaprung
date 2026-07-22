// node --test src/**/*.test.js
import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { challengeFromSearch, dayFromPath, parseRoute } from './useRoute.js'

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

describe('challengeFromSearch', () => {
  test('a well-formed code is handed through raw', () => {
    assert.equal(challengeFromSearch('?c=RklORElGSU5F'), 'RklORElGSU5F')
    assert.equal(challengeFromSearch('?utm_source=x&c=Zm9v'), 'Zm9v')
  })

  test('missing, empty, or out-of-alphabet codes are no request', () => {
    assert.equal(challengeFromSearch(''), null)
    assert.equal(challengeFromSearch('?x=1'), null)
    assert.equal(challengeFromSearch('?c='), null)
    // URLSearchParams decodes + to a space, %xx to bytes — both leave the
    // base64url alphabet and read as junk, not a code.
    assert.equal(challengeFromSearch('?c=ab+cd'), null)
    assert.equal(challengeFromSearch('?c=ab%2Fcd'), null)
  })
})

describe('parseRoute', () => {
  test('/archive is the archive index', () => {
    assert.deepEqual(parseRoute('/archive'), { view: 'archive' })
    assert.deepEqual(parseRoute('/archive/'), { view: 'archive' })
  })

  test('a number is a specific puzzle', () => {
    assert.deepEqual(parseRoute('/5'), { view: 'day', day: 5 })
  })

  test('root and junk are today', () => {
    assert.deepEqual(parseRoute('/'), { view: 'today' })
    assert.deepEqual(parseRoute('/nope'), { view: 'today' })
  })
})

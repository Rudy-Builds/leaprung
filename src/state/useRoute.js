import { useCallback, useEffect, useState } from 'react'

/**
 * The puzzle number named by the path: "/5" -> 5, "/" -> null, anything else ->
 * null. A day is always a positive integer, so a zero, a negative, or hand-typed
 * junk ("/abc", "/5x") reads as "no request" and the app simply shows today
 * rather than erroring. Exported for its own unit test — it's the whole contract.
 */
export function dayFromPath(pathname) {
  const m = /^\/(\d+)\/?$/.exec(pathname)
  if (!m) return null
  const n = Number(m[1])
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * The whole route in one value, so Boot switches on `view` rather than juggling
 * flags: '/archive' -> the archive index, '/privacy' & '/terms' -> the legal
 * pages, '/N' -> a specific puzzle (today's daily or a past one, decided against
 * today), anything else -> today.
 */
export function parseRoute(pathname) {
  if (pathname === '/archive' || pathname === '/archive/') return { view: 'archive' }
  if (pathname === '/privacy' || pathname === '/privacy/') return { view: 'privacy' }
  if (pathname === '/terms' || pathname === '/terms/') return { view: 'terms' }
  const day = dayFromPath(pathname)
  return day == null ? { view: 'today' } : { view: 'day', day }
}

/**
 * The challenge code named by the query string: "?c=<base64url>" -> the raw
 * code, anything else -> null. Character-set checked only — real validation
 * needs the puzzle and dictionary, which don't exist at route level; see
 * challenge.js. Exported for its unit test, like dayFromPath above.
 */
export function challengeFromSearch(search) {
  const code = new URLSearchParams(search).get('c')
  return code && /^[A-Za-z0-9_-]+$/.test(code) ? code : null
}

/**
 * Minimal path routing over the History API — enough for "/N deep-links to a
 * puzzle" and nothing more. `not_found_handling: single-page-application`
 * (wrangler.jsonc) serves index.html for any path, so the server never 404s on
 * "/5"; this reads that path client-side.
 *
 * The popstate listener is what makes the browser Back button work after an
 * in-app navigate (e.g. "play today" from an archive puzzle).
 */
export function useRoute() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  // A challenge is an ENTRY property, not a route property: it's meaningful only
  // on the "/N?c=..." link someone actually opened, pinned to that N. Captured
  // once so in-app navigation can't drag it onto other puzzles, and kept when
  // the visitor wanders off and Back-buttons in again (navigate pushes bare
  // paths, so the ?c= itself survives only in this state, deliberately).
  const [challenge] = useState(() => {
    const day = dayFromPath(window.location.pathname)
    const code = challengeFromSearch(window.location.search)
    return day != null && code ? { day, code } : null
  })

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // `replace` for corrections that shouldn't add a Back entry (normalising a
  // future/junk URL); a normal push for an intentional move the user can undo.
  const navigate = useCallback((path, { replace = false } = {}) => {
    if (path !== window.location.pathname) {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', path)
    }
    setPathname(path)
  }, [])

  return { route: parseRoute(pathname), navigate, challenge }
}

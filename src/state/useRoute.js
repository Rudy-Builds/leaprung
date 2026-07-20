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

  return { requestedDay: dayFromPath(pathname), navigate }
}

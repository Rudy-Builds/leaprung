import { useCallback, useEffect, useState } from 'react'
import { loadThemePref, saveThemePref } from './storage.js'

// The cycle order of the toggle: following the device, then the two overrides.
const ORDER = ['system', 'light', 'dark']

// Must match the --bg tokens in app.css (and the pre-paint script in index.html)
// so the mobile browser chrome matches the page.
const THEME_COLOR = { light: '#f2f4fb', dark: '#0f1220' }

const lightMedia = () => window.matchMedia('(prefers-color-scheme: light)')

/** The concrete light|dark theme a preference resolves to right now. */
function resolve(pref) {
  if (pref === 'light' || pref === 'dark') return pref
  return lightMedia().matches ? 'light' : 'dark'
}

// The stored value is the *preference*; <html data-theme> is always the resolved
// light|dark that the CSS keys off. index.html sets this before first paint; we
// re-assert it here and keep it live.
function apply(resolved) {
  document.documentElement.dataset.theme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[resolved])
}

/**
 * Theme preference state: 'system' (default, follows the OS), 'light' or 'dark'.
 * Returns the current preference and a `cycle` that advances system → light →
 * dark → system.
 */
export function useTheme() {
  const [pref, setPref] = useState(loadThemePref)

  // Reflect the preference onto <html> and persist it. Also runs on mount, which
  // re-syncs the OS-resolved value in case it changed between the pre-paint
  // script and hydration.
  useEffect(() => {
    apply(resolve(pref))
    saveThemePref(pref)
  }, [pref])

  // Only while following the device do OS changes matter — this fires when the
  // player flips their system between light and dark with the tab open.
  useEffect(() => {
    if (pref !== 'system') return
    const mq = lightMedia()
    const onChange = () => apply(resolve('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const cycle = useCallback(() => {
    setPref((p) => ORDER[(ORDER.indexOf(p) + 1) % ORDER.length])
  }, [])

  return { pref, cycle }
}

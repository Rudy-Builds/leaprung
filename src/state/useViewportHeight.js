import { useEffect } from 'react'

// The on-screen keyboard is invisible to CSS. `dvh` tracks the URL bar, not the
// keyboard: on iOS the keyboard overlays the *visual* viewport and leaves the
// *layout* viewport untouched, so anything pinned to the bottom of a 100dvh box
// lands underneath it (`position: fixed` fails the same way — it resolves
// against the layout viewport too). window.visualViewport is the only thing that
// sees the keyboard.
//
// Same reason `@media (max-height:)` is unusable here: it resolves against the
// layout viewport, so it never fires when the iOS keyboard opens — but it *does*
// fire on Chrome Android with interactiveWidget=resizes-content. Height tiers
// are driven from here instead so both platforms behave identically.

const SHORT_H = 560 // keyboard up on a mid-size phone, or a small phone at rest
const TINY_H = 400 // keyboard up on a small phone
const KB_DELTA = 100 // URL-bar collapse moves innerHeight <=60px; keyboards >=200px

export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return // Safari <=12: CSS falls back to 100dvh, no keyboard handling

    const root = document.documentElement
    let frame = 0

    const clear = () => {
      root.style.removeProperty('--app-h')
      root.classList.remove('kb-open', 'vp-short', 'vp-tiny')
    }

    const apply = () => {
      frame = 0

      // Pinch-zoom shrinks visualViewport.height exactly like the keyboard does,
      // and height alone can't tell them apart — mirroring it while zoomed to 3x
      // would squash the app into a sliver *because the user zoomed in*. Hand
      // back to dvh; footer position stops mattering once the view is pannable.
      if (vv.scale > 1.01) {
        clear()
        return
      }

      // floor, not round: Safari reports fractional heights (Chrome rounds), and
      // rounding 659.6 up to 660 makes the column half a pixel taller than the
      // real viewport — a hairline clip at the bottom edge that differs by
      // browser. Flooring can only ever undershoot.
      const h = Math.floor(vv.height)
      root.style.setProperty('--app-h', `${h}px`)
      root.classList.toggle('vp-short', h < SHORT_H)
      root.classList.toggle('vp-tiny', h < TINY_H)
      // Only used to drop the home-indicator inset, which sits behind the
      // keyboard anyway.
      root.classList.toggle('kb-open', window.innerHeight - h > KB_DELTA)

      // Before our resize lands iOS may scroll the document to reveal the focused
      // input. Once the app is keyboard-sized nothing is hidden, so that scroll is
      // pure damage. Terminates: scrollTo(0, 0) at 0 fires no event.
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }

    // Coalesce the resize+scroll burst into one write per frame — without this
    // you get a style write per event and visible jitter.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    apply()
    vv.addEventListener('resize', schedule)
    // `resize` alone is not enough: iOS fires scroll on the visual viewport
    // throughout the keyboard animation, and sometimes fires scroll with no
    // resize at all when focus moves between inputs.
    vv.addEventListener('scroll', schedule)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      clear()
    }
  }, [])
}

import React, { useLayoutEffect, useRef } from 'react'
import { isOneLetterDiff } from '../game/rules.js'

const PIN_SLACK = 24 // px from the bottom that still counts as "following"

// Vertical history of every word played. A step that isn't a one-letter change
// from the previous word must have been a leap, so we mark it — no need to
// thread per-step flags through state.
//
// This is also the layout's only scroll surface: it absorbs the space the
// keyboard takes so the input and Leap button never get pushed off-screen.
export function WordChain({ path, end }) {
  const scrollRef = useRef(null)
  const pinnedRef = useRef(true)
  // Only a real gesture may unpin. The smooth follow-scroll fires 'scroll'
  // events of its own, and its early frames sit further than PIN_SLACK from the
  // bottom — reading those as "the player scrolled up" meant any resize that
  // landed mid-animation (the keyboard sliding up does exactly this) skipped
  // the re-pin and left the newest rows clipped under the input.
  const userScrollRef = useRef(false)
  const firstRunRef = useRef(true)

  // Follow the newest row. scrollTop, not scrollIntoView: scrollIntoView scrolls
  // every scrollable ancestor including the layout viewport, which is the exact
  // scroll we're fighting on iOS. Smoothness (and prefers-reduced-motion) is
  // CSS's job via scroll-behavior — except on mount, where animating a
  // rehydrated ladder down from row one is noise, and an interrupted animation
  // could strand it mid-flight before the resize handlers below exist.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // A new move always re-follows, even if the player had scrolled up.
    pinnedRef.current = true
    userScrollRef.current = false
    if (firstRunRef.current) {
      firstRunRef.current = false
      el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
    } else {
      el.scrollTop = el.scrollHeight
    }
    el.classList.toggle('is-scrollable', el.scrollHeight > el.clientHeight + 1)
  }, [path.length])

  // The keyboard opening shrinks this box, which scrolls the newest row out of
  // view. Re-pin — but not if the player deliberately scrolled up to read back.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    // touch/wheel/pointer covers finger scrolls (and their momentum tail),
    // trackpads, and scrollbar drags. Programmatic scrolls fire none of them.
    const markUser = () => { userScrollRef.current = true }
    const onScroll = () => {
      if (!userScrollRef.current) return
      pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_SLACK
    }
    const ro = new ResizeObserver(() => {
      // 'instant', not 'auto': don't animate a re-pin during the keyboard slide.
      // This also aborts any in-flight follow-animation dead on target — mid-
      // resize is exactly when browsers disagree about finishing one.
      if (pinnedRef.current) el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
      // The box only overflows once it's been squeezed, so the fade has to be
      // re-evaluated on resize, not just when a row is added.
      el.classList.toggle('is-scrollable', el.scrollHeight > el.clientHeight + 1)
    })

    el.addEventListener('touchstart', markUser, { passive: true })
    el.addEventListener('wheel', markUser, { passive: true })
    el.addEventListener('pointerdown', markUser, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    ro.observe(el)
    return () => {
      el.removeEventListener('touchstart', markUser)
      el.removeEventListener('wheel', markUser)
      el.removeEventListener('pointerdown', markUser)
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="chain-scroll" ref={scrollRef}>
      <ol className="chain">
        {path.map((word, i) => {
          const prev = i > 0 ? path[i - 1] : null
          const leap = prev && !isOneLetterDiff(prev, word)
          const isStart = i === 0
          const isCurrent = i === path.length - 1
          const isEnd = word === end
          return (
            <li
              className={`chain-row ${isStart ? 'start' : ''} ${isCurrent ? 'current' : ''} ${isEnd ? 'won' : ''}`}
              key={`${word}-${i}`}
            >
              {leap && <span className="leap-mark" title="leap">⤳</span>}
              <div className="chain-tiles">
                {word.split('').map((ch, j) => {
                  const changed = prev && !leap && prev[j] !== ch
                  return (
                    <span className={`tile small ${changed ? 'changed' : ''}`} key={j}>
                      {ch}
                    </span>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

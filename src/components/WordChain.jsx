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

  // Follow the newest row. scrollTop, not scrollIntoView: scrollIntoView scrolls
  // every scrollable ancestor including the layout viewport, which is the exact
  // scroll we're fighting on iOS. Smoothness (and prefers-reduced-motion) is
  // CSS's job via scroll-behavior.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    el.classList.toggle('is-scrollable', el.scrollHeight > el.clientHeight + 1)
  }, [path.length])

  // The keyboard opening shrinks this box, which scrolls the newest row out of
  // view. Re-pin — but not if the player deliberately scrolled up to read back.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_SLACK
    }
    const ro = new ResizeObserver(() => {
      // 'instant', not 'auto': don't animate a re-pin during the keyboard slide.
      if (pinnedRef.current) el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
      // The box only overflows once it's been squeezed, so the fade has to be
      // re-evaluated on resize, not just when a row is added.
      el.classList.toggle('is-scrollable', el.scrollHeight > el.clientHeight + 1)
    })

    el.addEventListener('scroll', onScroll, { passive: true })
    ro.observe(el)
    return () => {
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
          const isCurrent = i === path.length - 1
          const isEnd = word === end
          return (
            <li
              className={`chain-row ${isCurrent ? 'current' : ''} ${isEnd ? 'won' : ''}`}
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

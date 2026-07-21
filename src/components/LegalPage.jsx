import React, { useEffect } from 'react'

// The one contact address for the whole site — kept in sync with HelpModal's
// feedback line. Change it in both places or neither.
const CONTACT = 'rudybuilds@pm.me'
// Bumped by hand whenever the wording below changes — it's the "last updated"
// line every policy is expected to carry, and dating it is the whole point.
const UPDATED = 'July 21, 2026'

// A leading email link, so a question is one tap away rather than a copy chore.
function Mail() {
  return <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
}

function PrivacyBody() {
  return (
    <>
      <p>
        Leapword is a daily word game, built to need as little of your data as
        possible. There are no accounts, and there is no server that stores anything
        about you.
      </p>

      <h2>What’s stored on your device</h2>
      <p>
        Your game data lives only in your own browser, in its local storage: your
        daily progress, your streak, which past puzzles you’ve finished, your theme
        choice, and whether you’ve seen the how-to-play screen. None of it leaves
        your device — we can’t see it, and clearing your browser data erases it.
      </p>

      <h2>What we don’t do</h2>
      <p>
        No accounts. No cookies. No ads. No third-party trackers. We don’t sell or
        share your data, because we don’t collect it.
      </p>

      <h2>Analytics</h2>
      <p>
        We use Cloudflare Web Analytics to see how quickly the site loads for real
        visitors. It’s privacy-first: it sets no cookies, doesn’t track you across
        sites, and collects no personal information. It is also switched off entirely
        for visitors in the EU.
      </p>

      <h2>Hosting</h2>
      <p>
        The site is served by Cloudflare. Like any web host, Cloudflare processes
        basic technical information — such as your IP address — to deliver and protect
        the site. See Cloudflare’s privacy policy for details.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, we’ll update the date above.</p>

      <h2>Contact</h2>
      <p>
        Questions? Email <Mail />.
      </p>
    </>
  )
}

function TermsBody() {
  return (
    <>
      <p>Leapword is a free daily word game. By playing, you agree to these terms.</p>

      <h2>Using Leapword</h2>
      <p>
        Play it, share it, enjoy it. Please don’t attack, overload, scrape, or
        otherwise misuse the service, and don’t use it to break the law.
      </p>

      <h2>Provided “as is”</h2>
      <p>
        Leapword is offered free of charge, without warranties of any kind. We don’t
        guarantee it will always be available, accurate, or error-free. To the fullest
        extent allowed by law, we aren’t liable for any damages arising from your use
        of it.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Leapword’s source code is open source, licensed under the MIT License (see the
        LICENSE file in the public repository). The name “Leapword,” its logo, and its
        visual identity are not covered by that license and remain the property of the
        creator.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the Commonwealth of Massachusetts,
        USA, without regard to its conflict-of-laws principles.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms, and we’ll update the date above when we do.</p>

      <h2>Contact</h2>
      <p>
        Questions? Email <Mail />.
      </p>
    </>
  )
}

/**
 * A static content page — Privacy or Terms — rendered in place of the game, the
 * same full-column shape as ArchivePage. `kind` picks the body; everything else
 * (back button, footer cross-links) is shared. Deliberately asset-free: Boot
 * renders these before the dictionary loads, so they open instantly and are
 * reachable even if the game’s data fetch is failing.
 */
export function LegalPage({ kind, onHome, onNavigate }) {
  const isPrivacy = kind === 'privacy'
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service'

  // Give crawlers and shared links a real title instead of the game’s. Restored
  // by index.html’s default on the next full load; in-app nav back to the game
  // remounts LeapwordGame, which doesn’t touch the title, so reset it on unmount.
  useEffect(() => {
    const prev = document.title
    document.title = `${title} — Leapword`
    return () => {
      document.title = prev
    }
  }, [title])

  return (
    <div className="legal">
      <header className="legal-top">
        <button className="help-btn" type="button" aria-label="Back to game" onClick={onHome}>
          ←
        </button>
        <h1 className="legal-title">{title}</h1>
      </header>

      <div className="legal-body">
        <p className="legal-updated">Last updated: {UPDATED}</p>

        {isPrivacy ? <PrivacyBody /> : <TermsBody />}

        <div className="legal-footer">
          {/* Real anchors, so they’re right-click-openable and crawlable; the
              onClick keeps it a slick in-app swap when JS is running. */}
          <a
            href={isPrivacy ? '/terms' : '/privacy'}
            onClick={(e) => {
              e.preventDefault()
              onNavigate(isPrivacy ? '/terms' : '/privacy')
            }}
          >
            {isPrivacy ? 'Terms of Service' : 'Privacy Policy'}
          </a>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              onHome()
            }}
          >
            Back to game
          </a>
        </div>
      </div>
    </div>
  )
}

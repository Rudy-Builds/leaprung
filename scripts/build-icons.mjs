// Rasterises the SVG sources in scripts/icons/ into the PNGs that index.html
// references. The outputs are committed, so this only needs running when the
// artwork changes — it is deliberately NOT part of `npm run build`.
//
// Why PNG at all: og:image must be a raster. Facebook, Slack, iMessage and
// Twitter all decline to unfurl an SVG, so the favicon can stay vector but the
// share card cannot.
//
// Uses headless Chrome because it's the only rasteriser on a stock Mac that
// honours an SVG's aspect ratio — macOS `qlmanage` renders into a square canvas
// regardless of viewBox, which silently letterboxes then crops your artwork.
//
// Usage: node scripts/build-icons.mjs

import { execFile } from 'node:child_process'
import { constants } from 'node:fs'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { findSvgFaults, formatFaults } from './lib/svg.mjs'
import { ROOT } from './lib/words.mjs'

const run = promisify(execFile)

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
]

const TARGETS = [
  { svg: 'scripts/icons/og.svg', out: 'public/og.png', width: 1200, height: 630 },
  { svg: 'public/favicon.svg', out: 'public/apple-touch-icon.png', width: 180, height: 180 },
]

// Refuse to rasterise artwork a browser cannot decode. The PNGs below would come
// out looking perfect regardless — they are rendered from an HTML page, whose
// comment parser is lenient where XML's is not — so this is the one moment the
// defect is cheap to catch: you are already looking at the artwork.
const faults = await findSvgFaults()
if (faults.length) {
  console.error(formatFaults(faults))
  process.exit(1)
}

// access(X_OK), not readFile: these are ~hundreds of MB of executable each, and
// slurping them into a Buffer to ask "does this path exist" is absurd.
const found = await Promise.all(
  CHROME_CANDIDATES.map((p) =>
    access(p, constants.X_OK).then(
      () => p,
      () => null,
    ),
  ),
)
const chrome = found.find(Boolean)

if (!chrome) {
  console.error('No Chrome/Chromium found. Install one, or hand-export the SVGs in scripts/icons/.')
  process.exit(1)
}

const tmp = await mkdtemp(join(tmpdir(), 'leaprung-icons-'))

for (const { svg, out, width, height } of TARGETS) {
  const markup = await readFile(resolve(ROOT, svg), 'utf8')
  // Inline the SVG in a zero-margin page sized to the target. Loading the .svg
  // directly would centre it on a white page with scrollbars.
  const html = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;overflow:hidden}
  svg{display:block;width:${width}px;height:${height}px}
</style>${markup}`
  const page = join(tmp, 'page.html')
  await writeFile(page, html)

  await run(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    `--screenshot=${resolve(ROOT, out)}`,
    `file://${page}`,
  ])
  console.log(`wrote ${out} (${width}×${height})`)
}

await rm(tmp, { recursive: true, force: true })

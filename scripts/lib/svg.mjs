// Guards the one SVG defect that ships silently: a double hyphen in a comment.
//
// XML forbids '--' inside a comment. A favicon is fetched as a standalone image
// and parsed as XML, so a comment that names a CSS custom property (--accent)
// makes the entire file undecodable and the tab falls back to a blank globe.
//
// Nothing else catches this. build-icons.mjs inlines the markup into an HTML
// page, and HTML's comment parser is lenient, so apple-touch-icon.png and og.png
// rasterise perfectly from a file no browser can load — the artwork looks fine
// everywhere you would think to check, and only the tab is broken. That is
// exactly how it reached production once already.

import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { ROOT } from './words.mjs'

// Every hand-authored SVG: public/ is served verbatim, scripts/icons/ feeds the
// rasteriser. Anything generated (dist/) is a copy of these.
const SVG_DIRS = ['public', 'scripts/icons']

const COMMENT = /<!--([\s\S]*?)-->/g

/** Lines inside an XML comment that carry an illegal '--', 1-indexed. */
export function findCommentFaults(markup) {
  const faults = []
  for (const match of markup.matchAll(COMMENT)) {
    if (!match[1].includes('--')) continue
    // The captured body starts on the same line as its '<!--'.
    const firstLine = markup.slice(0, match.index).split('\n').length
    match[1].split('\n').forEach((text, i) => {
      if (text.includes('--')) faults.push({ line: firstLine + i, text: text.trim() })
    })
  }
  return faults
}

export async function findSvgFaults() {
  const faults = []
  for (const dir of SVG_DIRS) {
    let entries
    try {
      entries = await readdir(resolve(ROOT, dir), { recursive: true })
    } catch {
      continue // directory is optional
    }
    for (const entry of entries) {
      if (!entry.endsWith('.svg')) continue
      const file = join(dir, entry)
      const markup = await readFile(resolve(ROOT, file), 'utf8')
      for (const fault of findCommentFaults(markup)) faults.push({ file, ...fault })
    }
  }
  return faults
}

export function formatFaults(faults) {
  return [
    faults.length === 1
      ? "1 SVG comment line contains '--', which XML forbids."
      : `${faults.length} SVG comment lines contain '--', which XML forbids.`,
    'Browsers parse a standalone .svg as XML and will refuse to decode these files,',
    'so the favicon would silently degrade to a blank globe:',
    '',
    ...faults.map(({ file, line, text }) => `  ${file}:${line}  ${text}`),
    '',
    "Reword the comment — a CSS token like '--accent' cannot survive in an SVG comment.",
  ].join('\n')
}

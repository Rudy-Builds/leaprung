import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

import { findSvgFaults, formatFaults } from './scripts/lib/svg.mjs'

// The favicon is the one asset Vite copies but never parses, so a malformed one
// reaches production unnoticed — see scripts/lib/svg.mjs for what that costs.
// This hangs off the build, not `npm test`, because the build is the only step
// the deploy is guaranteed to run. buildStart also fires for `vite dev`, so a
// bad edit surfaces as soon as the server restarts.
const validateSvgAssets = () => ({
  name: 'leapword-validate-svg-assets',
  async buildStart() {
    const faults = await findSvgFaults()
    if (faults.length) this.error(formatFaults(faults))
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare(), validateSvgAssets()],
  // Vite doesn't read $PORT on its own. Honour it when the environment assigns
  // one — e.g. the preview harness picks a free port when another dev server
  // already holds the default 5173. Unset for a normal `npm run dev`, so this is
  // `undefined` and Vite falls back to its own default. strictPort so a taken
  // assigned port fails loudly instead of drifting to one the harness won't find.
  server: process.env.PORT
    ? { port: Number(process.env.PORT), strictPort: true }
    : undefined,
})
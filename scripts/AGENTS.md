# DOX — scripts

Build tooling for FutCard. Parent rail: [../AGENTS.md](../AGENTS.md).

## Purpose

Produce the GitHub Pages artifact from `src/` and `public/`, keep placeholder icons generated, and test the artifact.

## Ownership

- `build-static.ts` — build pipeline: cleans `dist/`, copies `src/` and `public/` (skipping `.md` files), fingerprints `app.js` → `app.<8-char-hash>.js` and `site.css` → `site.<8-char-hash>.css` (sha256 prefix), rewrites references in `dist/index.html`, resolves `dist/sw.js` placeholders, writes `.nojekyll`.
- `build-static.test.ts` — Bun test that runs the build and asserts the artifact shape.
- `generate-icons.ts` — regenerates placeholder SVG icons into `public/` (`favicon.svg`, `icons/icon-192.svg`, `icons/icon-512.svg`, `icons/maskable-icon.svg`).

## Local Contracts

- The `precacheUrls` list in `build-static.ts` defines the assets the service worker precaches. Adding or removing a root-level asset requires updating that list in the same change.
- `src/sw.js` placeholders (`__FUTCARD_SW_VERSION__`, `__FUTCARD_PRECACHE_URLS__`) must stay intact in source; only the build resolves them into `dist/`.
- `.md` files are never copied to `dist/`.
- The fingerprint naming scheme (`app.` + 8-character hash + extension, same for `site.`) is asserted by tests; keep it stable.

## Work Guidance

- Bun-first: run these scripts with `bun run …` or `bun <file>.ts`; do not introduce Node-only tooling or extra build dependencies.

## Verification

- `bun test` — `build-static.test.ts` executes `buildStaticSite()` and asserts `index.html`, fingerprinted `app.*.js` / `site.*.css`, `manifest.webmanifest`, fully resolved `sw.js`, `favicon.svg`, and `.nojekyll` in `dist/`.
- `bun run check` — these scripts are strict TypeScript; keep them type-clean.

## Child DOX Index

None — no nested boundaries.

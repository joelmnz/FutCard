# FutCard

FutCard is a client-side football card trading game built with Svelte 5, TypeScript, Vite, and Bun.

The game runs entirely in the browser (with IndexedDB persistence) and is designed around a simple loop:
onboard your manager, open packs, manage your collection, trade and sell cards, play matches, and grow your club value.

## Features

- Onboarding flow for first-time setup
- Card collection with rarity tiers and detailed stats
- Pack opening system (Bronze, Silver, Gold, Elite) with weighted rarity odds
- Live transfer market with auto-replenished listings and price movement
- AI trade bots with distinct negotiation styles
- Match simulation with chemistry-influenced outcomes and coin rewards
- XP/upgrade systems for progressing cards over time
- Offline-first persistence via IndexedDB + debounced autosave
- PWA support for installability and update handling

## Tech Stack

- Svelte 5 (Runes)
- TypeScript (strict mode)
- Vite 6
- Bun (package manager, scripts, test runner)
- IndexedDB via `idb`
- `vite-plugin-pwa` + Workbox

## Getting Started

### Prerequisites

- Bun installed locally

### Install

```bash
bun install
```

### Run the app

```bash
bun run dev
```

The dev server is configured with `strictPort: true` and runs on port `5177`.

## Scripts

- `bun run dev` - start development server
- `bun run check` - run TypeScript + Svelte checks
- `bun run typecheck` - run TypeScript project references check
- `bun test` - run unit tests
- `bun run build` - build production bundle
- `bun run preview` - preview production build locally
- `bun run icons` - regenerate app icons

## App Architecture

Top-level areas:

- `src/core/` - platform layer (db, persistence, shared state, domain types)
- `src/features/` - gameplay/domain modules (onboarding, dashboard, collection, portfolio, packs, market, trade, match, cards, upgrades)
- `src/ui/` - reusable UI components and style tokens
- `tests/` - test setup and shared test utilities
- `docs/` - product specification and implementation notes

Startup flow:

1. `src/main.ts` hydrates persisted state from IndexedDB
2. `src/main.ts` mounts the app
3. `src/App.svelte` initializes autosave listeners

## Persistence Notes

- Data is stored in IndexedDB (`futcard-db`) across game, collection, market, and bots.
- Autosave is debounced (500ms) to reduce write frequency during active gameplay.

## Deployment Notes

- Vite base path is set to `/futcard/`.
- PWA start URL and scope are also configured for `/futcard/`.
- If you host under a different path, update `vite.config.ts` accordingly.

## Testing

Service and engine tests run with Bun. Test preload configuration in `bunfig.toml` uses `tests/setup.ts` to provide minimal runes-compatible shims for non-component logic.

## Reference Docs

- Product spec: `docs/SPEC.md`
- Implementation notes: `docs/INITIAL_IMPLEMENTATION.md`
- Visual prototype: `docs/futcard-singlepage-poc.html`

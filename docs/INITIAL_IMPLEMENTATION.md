# FutCard Beta — AI Agent Implementation Guide

## Prerequisites
- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Bun-first workflow for install/check/test/build (no separate Node-first flow)
- Git repo initialised and pushed to GitHub
- GitHub Pages enabled on repo (Settings → Pages → GitHub Actions source)

---

## Step 1 — Scaffold Project

```bash
bun create vite futcard --template svelte-ts
cd futcard
bun install
bun add idb
bun add -d vite-plugin-pwa workbox-window svelte-check
```

Create exact folder structure from SPEC.md. Create all files as empty stubs first so imports resolve before logic is written.

---

## Step 2 — Configuration Files

### `tsconfig.json`
- `strict: true`
- `moduleResolution: bundler`
- `target: ES2022`
- Include `src/**/*.ts` and `src/**/*.svelte`

### `svelte.config.ts`
- Use `vitePreprocess()`
- No adapter needed (static output)

### `vite.config.ts`
- Base: `'/futcard/'` for GitHub Pages deploy from `joelmnz/futcard`
- `@sveltejs/vite-plugin-svelte`
- `vite-plugin-pwa` with full manifest and Workbox config per SPEC
- Pre-cache: all JS/CSS/HTML/SVG/JSON assets

### `bunfig.toml`
```toml
[test]
preload = ["./tests/setup.ts"]
```

---

## Step 3 — CSS Design Tokens

`src/ui/styles/tokens.css` — all CSS custom properties from SPEC palette.
`src/ui/styles/global.css` — reset, body defaults, scrollbar styles, font stack.
`src/ui/styles/animations.css` — keyframes: shimmer, pulse, legendaryGlow, cardFlip, slideIn, fadeOut.

Import all three in `main.ts`.

---

## Step 4 — Core Types

Write all types in `src/core/types/` before any logic. Key interfaces:

**`card.types.ts`**
```
PlayerTemplate   — raw data from players.json
Card             — owned card instance (extends template + cardId, rarity, xp, upgradeCount, priceHistory, currentPrice)
Rarity           — 'common' | 'rare' | 'epic' | 'legendary'
Position         — 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST' | 'CF'
```

**`game.types.ts`**
```
GameState        — managerName, coins, xpPool, onboardingDone, lastSaved
```

**`market.types.ts`**
```
MarketListing    — listingId, card, listPrice, listedAt, isPlayerListed
```

**`trade.types.ts`**
```
Bot              — id, name, emoji, style, cards[]
TradeOffer       — yourCards[], botCards[], coinTopUp
TradeResult      — accepted, reason
```

**`match.types.ts`**
```
Formation        — name, positions[]
MatchEvent       — minute, type, description, score
MatchResult      — homeScore, awayScore, events[], rewards, motm
```

---

## Step 5 — IndexedDB Setup

`src/core/db/db.ts`
- Open `futcard-db` version 1
- Create all object stores with indexes per SPEC schema
- Do not create a standalone `priceHistory` store (history remains in each card record)
- Export typed `getDB()` async function

`src/core/db/db.helpers.ts`
- Generic typed wrappers: `dbGet`, `dbSet`, `dbDelete`, `dbGetAll`, `dbPut`
- All functions async, all errors caught and logged

---

## Step 6 — State Runes

Each state file exports a `$state` rune object and mutation functions.
Pattern for every state file:

```ts
// collection.state.svelte.ts
export const collectionState = $state({ cards: [] as Card[] })
export function addCard(card: Card) { collectionState.cards.push(card) }
export function removeCard(id: string) { ... }
```

State files:
- `game.state.svelte.ts` — coins, xpPool, managerName, onboardingDone
- `collection.state.svelte.ts` — cards[]
- `market.state.svelte.ts` — listings[]
- `trade.state.svelte.ts` — bots[], yourOffer, botOffer, selectedBotId

---

## Step 7 — Persistence Layer

`src/core/persistence/hydrate.ts`
- Called once on app mount
- Reads all IDB stores → calls state mutation functions to populate
- If no saved state found → runs `initNewGame()` (starter pack, 1M coins)

`src/core/persistence/autosave.ts`
- Exports `setupAutosave()` — called once after hydration
- Uses Svelte `$effect` to watch each state object
- Debounced 500ms write to IDB on any change
- Updates `gameState.lastSaved` timestamp
- Triggers "💾 Saved" toast (brief, subtle)

---

## Step 8 — Player Dataset

`src/data/players.json`
- Start with a phased dataset (initial curated/generated seed set), then expand toward full target coverage
- Clubs: all 20 Premier League clubs (2023/24 season squads)
- Include ~20 international stars from top European clubs
- Stats: relative quality, not exact FIFA values
  - World class (Salah, De Bruyne): 85–92 base overall
  - Good PL players: 72–84
  - Squad players: 60–71
- Ensure position distribution covers all positions
- Include: name, club, nation (emoji flag), league, position, pace, shooting, passing, dribbling, defense
- Initial entries can be hand-curated/generated; expand in later passes

`src/features/cards/card.generator.ts`
- `generateCard(template, rarity)` → Card
- Stat variance: Legendary ±2, Epic ±3, Rare ±4, Common ±5
- Price formula:
  ```
  base = overall² × rarityMultiplier
  rarityMultiplier: common=10, rare=50, epic=200, legendary=800
  ```
- Returns full Card object with UUID, empty priceHistory, xp:0, upgradeCount:0

`src/features/cards/card.utils.ts`
- `calcOverall(stats)` → weighted average
- `getRarityColour(rarity)` → CSS var string
- `formatCoins(n)` → "1.2M" / "45.3K" / "999"
- `getPositionArchetype(position)` → 'goalkeeper' | 'defender' | 'midfielder' | 'attacker'

---

## Step 9 — SVG Card Component

`src/features/cards/components/Card.svelte`

SVG structure (viewBox="0 0 200 280"):
1. `<defs>` — linearGradient per rarity, filter for glow, clipPath
2. Background rect with diagonal gradient
3. Top-left: OVR number (large, bold), position text below
4. Centre: player silhouette SVG path (4 archetypes: GK/DEF/MID/ATT)
5. Name banner: rect + text, bottom third
6. Stat bars: 5 rows of label + rect progress bar + value
7. Bottom corners: nation flag text + club abbreviation
8. Legendary only: animated SVG circles (particle effect)
9. Epic only: animated shimmer rect overlay

Props: `card: Card`, `size: 'full' | 'mini' | 'micro'`
Emit: `onclick` event

`src/features/cards/components/CardGrid.svelte`
- CSS grid, responsive columns via `auto-fill minmax()`
- Accepts `cards: Card[]`, slot for empty state

`src/features/cards/components/CardDetail.svelte`
- Modal content (used inside `Modal.svelte`)
- Full stat bars with animated fill on mount
- Price history sparkline (inline SVG)
- Upgrade button → opens UpgradeModal
- Sell button → opens SellModal

---

## Step 10 — UI Primitives

`src/ui/components/Modal.svelte`
- Slot-based, backdrop click closes
- Trap focus, ESC key closes
- Smooth scale-in animation

`src/ui/components/Toast.svelte` + `ToastContainer.svelte`
- ToastContainer: fixed bottom-right, flex column
- Toast: auto-removes after 3s, slide-in animation
- Types: success / error / warning / info → different left border colour

`src/ui/components/Button.svelte`
- Props: `variant` (primary/gold/danger/outline/ghost), `size` (sm/md/lg), `disabled`, `loading`

`src/ui/components/Nav.svelte`
- Logo left, tabs centre, coins right
- Active tab highlighted
- Subtle save indicator

`src/ui/components/UpdatePrompt.svelte`
- Listen for `vite-plugin-pwa` `needRefresh` event
- Show "🆕 Update available — click to refresh" banner

---

## Step 11 — Feature Pages

Build each page in this order (each depends on previous):

### 11a. Onboarding
`src/features/onboarding/components/OnboardingFlow.svelte`
- Shown if `!gameState.onboardingDone`
- Step 1: Animated logo + "Welcome to FutCard"
- Step 2: "What's your name, Manager?" text input
- Step 3: "Here's your starter pack!" → triggers pack reveal animation
- Step 4: Brief tooltip tour overlay (3 hotspots)
- On complete: set `onboardingDone = true`, save

### 11b. Dashboard
- Stat boxes: total cards, collection value, coins, rarity counts
- Best 5 cards grid
- Hot market listings (5 cards, buy button)
- Price ticker strip (top 10 epic/legendary by price)

### 11c. Collection
- Filter bar + sort controls
- CardGrid with all owned cards
- Click → CardDetail modal

### 11d. Packs
- 4 pack cards with cost, description, rarity odds
- Buy button → deduct coins → PackReveal overlay
- PackReveal: staggered card flip animations (200ms each)
- "Add to Collection" closes overlay

### 11e. Market
- Search + filter bar (rarity, position, price sort)
- CardGrid of listings with buy button overlay on hover
- SellModal: price input, suggested price, list button
- Price ticker
- Market replenishes to 120 listings automatically

### 11f. Trade
- Bot selector chips
- Two-panel layout: Your Offer | Bot's Offer
- Card selector modal (click to add/remove)
- Coin top-up input
- Fairness indicator
- Propose button → 1.2s delay → result toast
- Bot collection preview below

### 11g. Match
- TeamBuilder: formation picker → 11 slot grid → click slot → pick card from collection
- Chemistry score display (live as you pick)
- Opponent selector (pick a bot)
- "Kick Off" button
- MatchSimulator: 10s animated timeline feed + live score
- MatchResult: final score, events summary, MOTM card, rewards

### 11h. Upgrades
- Accessed from CardDetail modal
- Shows card XP bar, upgradeCount / 10
- Two upgrade options: Stat Boost (pick stat) / Rarity Promote
- Confirm modal with cost display

### 11i. Portfolio
- SVG line chart of collection value over time
- Summary: current value, change since start, best card, top gainer

---

## Step 12 — Game Systems

### Market Price Engine
`src/features/market/market.engine.ts`
- `startPriceFluctuation()` — `setInterval` every 8s
- Each tick: random walk ±8% per listing
- Update `currentPrice`, append to `priceHistory` (trim to 30)
- Trigger reactive state update

### Match Engine
`src/features/match/match.engine.ts`
- `simulateMatch(yourTeam, opponentBot)` → `Promise<MatchResult>`
- Promise-based async API contract (resolve with events + result)
- Caller animates events over 10s (one event per ~300ms)
- Chemistry calculated before simulation
- Rewards calculated from result + opponent avg overall

### Trade AI
`src/features/trade/trade.ai.ts`
- `evaluateTrade(offer, bot)` → `TradeResult`
- Threshold per bot style per SPEC
- Returns `{ accepted: boolean, reason: string }`

### Upgrade Service
`src/features/upgrades/upgrade.service.ts`
- `canUpgrade(card)` → boolean (upgradeCount < 10, enough XP)
- `applyStatBoost(card, stat)` → Card
- `applyRarityPromotion(card)` → Card
- Both write to IDB and update collection state

---

## Step 13 — Unit Tests

Location: alongside service files as `*.test.ts`

### Initial critical test coverage (phase 1):
```
card.generator.test.ts
  ✓ generateCard returns correct rarity
  ✓ stats within variance bounds
  ✓ price formula produces positive value
  ✓ upgradeCount initialises to 0

pack.service.test.ts
  ✓ weightedRarity distribution within expected bounds (1000 rolls)
  ✓ pack deducts correct coin amount
  ✓ returns correct card count per pack type

market.engine.test.ts
  ✓ price fluctuation stays within ±8%
  ✓ priceHistory never exceeds 30 entries

match.engine.test.ts
  ✓ simulateMatch returns valid score (non-negative)
  ✓ events array is non-empty
  ✓ rewards scale with opponent rating
  ✓ chemistry score clamps 0–100

trade.ai.test.ts
  ✓ generous bot accepts fair trade
  ✓ greedy bot rejects undervalue offer
  ✓ elite bot rejects common card offers

upgrade.service.test.ts
  ✓ stat boost increments chosen stat by 1
  ✓ stat boost cannot exceed 99
  ✓ cannot upgrade beyond 10 total

match.engine.test.ts
  ✓ simulateMatch returns Promise<MatchResult>
  ✓ simulateMatch returns valid non-negative score

pack.service.test.ts
  ✓ pack deducts correct coin amount
  ✓ returns correct card count per pack type

market.engine.test.ts
  ✓ price fluctuation stays within ±8%
  ✓ priceHistory never exceeds 30 entries
```

Add broader coverage from this guide in later phases once core systems stabilise.

---

## Step 14 — PWA Icons

`scripts/generate-icons.ts`
- Bun script using Canvas API or inline SVG strings
- Generates: `public/icons/icon-192.png`, `icon-512.png`, `maskable-icon.png`
- Icon design: football emoji on dark `#080c14` background with `#00ff87` accent ring
- Run with `bun run icons` before first build

---

## Step 15 — GitHub Actions

`.github/workflows/deploy.yml`
```yaml
name: Deploy FutCard
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run check
      - run: bun test
      - run: bun run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

---

## Build Order Summary

```
1.  Scaffold + config files
2.  CSS tokens + global styles
3.  Core types (all of them, no logic yet)
4.  IndexedDB setup + helpers
5.  State runes (all stores)
6.  Persistence (hydrate + autosave)
7.  players.json dataset
8.  card.generator + card.utils
9.  SVG Card component
10. UI primitives (Modal, Toast, Button, Nav)
11. Onboarding flow
12. Dashboard page
13. Collection page
14. Packs page + PackReveal
15. Market page + price engine
16. Trade page + trade AI
17. Match page + match engine
18. Upgrades system
19. Portfolio page + SVG chart
20. UpdatePrompt
21. Unit tests
22. PWA icons script
23. GitHub Actions workflow
24. Final: bun run check && bun test && bun run build
```

---

## Agent Notes
- Always run `bun run check` after each step before proceeding
- Never use `any` type — use `unknown` and narrow
- All async IDB calls must be awaited and wrapped in try/catch
- Svelte 5 runes: use `$state`, `$derived`, `$effect` — not old store syntax
- CSS: use scoped `<style>` in each Svelte component + import global tokens via CSS custom properties
- `players.json` must be imported as a static asset (Vite handles this at build time)
- Test files use `import { describe, it, expect } from 'bun:test'`
- No `console.log` in production code — use a `logger.ts` util that no-ops in prod

---

## Implementation Tracking Notes

### 2026-03-21 — Step 1 verification + partial completion
- Verified repository was already scaffolded as Vite + Svelte + TypeScript.
- Installed missing Step 1 dependencies:
  - `idb`
  - `vite-plugin-pwa`
  - `workbox-window`
  - `svelte-check` (already present, retained at latest compatible version)
- Created the Step 1 skeleton folders/files as empty stubs to unblock upcoming implementation steps:
  - `src/core/*` (types, db, state, persistence)
  - `src/data/players.json`
  - `src/features/*` initial feature/service/component paths
  - `src/ui/styles/*` and `src/ui/components/*`
  - `scripts/generate-icons.ts`, `tests/setup.ts`, `.github/workflows/deploy.yml`, `bunfig.toml`
- Note:
  - `vite-plugin-pwa` currently reports a peer warning against the installed Vite version. This is non-blocking for Step 1 scaffold work and will be validated during Step 2 configuration/build checks.
### 2026-03-21 — Steps 2-15 implementation pass
- Resolved dependency conflict by aligning to a compatible matrix:
  - `vite` -> `^6.4.1`
  - `@sveltejs/vite-plugin-svelte` -> `^6.2.1`
  - `vite-plugin-pwa` -> `^0.21.2`
- Step 2 completed:
  - `tsconfig.json` strict/bundler/ES2022 configured
  - `svelte.config.js` uses `vitePreprocess()`
  - `vite.config.ts` configured with `/futcard/` base and PWA plugin setup
  - `bunfig.toml` test preload configured
- Steps 3-8 completed with foundational implementations:
  - tokens/global/animations styles
  - core types
  - IndexedDB schema/helpers
  - rune state files
  - hydrate/autosave
  - seed `players.json`
  - card generator/utils
- Steps 9-12 completed with functional MVP components/pages/systems:
  - Card/CardGrid/CardDetail
  - UI primitives (Modal/Toast/Button/Nav/UpdatePrompt)
  - Onboarding + tabbed app shell
  - Market engine, trade AI, match engine, upgrades service
- Steps 13-15 completed:
  - critical unit tests implemented and passing
  - icon generation script added (SVG placeholders)
  - full GitHub Actions deploy workflow added
- Review-driven risk fixes applied:
  - autosave now clears stores before rewrite (prevents deleted entity resurrection)
  - market listing exploit fixes (self-buy block, remove card on listing, replenish logic)
  - elite trade rule tightened to epic/legendary-only offers
  - check script enforces both `svelte-check` and `tsc --noEmit`
- Validation status:
  - `bun run check` -> pass (0 errors, 0 warnings)
  - `bun test` -> pass (18 tests)
  - `bun run build` -> pass

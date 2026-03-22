# FutCard Beta — Product Specification

## Overview
A football card trading PWA for children. 100% client-side, no backend, full offline support.
Installable on desktop via PWA. Built with Svelte 5, Vite, Bun, TypeScript strict mode.

---

## Tech Stack
| Concern | Choice |
|---|---|
| Runtime | Bun |
| Build | Vite 6 |
| Framework | Svelte 5 (Runes) |
| CSS | Svelte scoped CSS + CSS custom properties |
| Storage | IndexedDB via `idb` library |
| State | Svelte 5 `$state` runes |
| PWA | `vite-plugin-pwa` (Workbox) |
| Testing | Bun test runner |
| Type check | `svelte-check` + `tsc --noEmit` |
| Deployment | GitHub Pages via GitHub Actions |

---

## Design System

### Palette — Football Stadium Theme
```css
--bg-primary:    #080c14   /* deep night stadium */
--bg-secondary:  #0f1520   /* card surfaces */
--bg-panel:      #161d2e   /* panels, nav */
--accent-green:  #00ff87   /* pitch green, primary CTA */
--accent-gold:   #ffd700   /* coins, legendary */
--accent-blue:   #4fc3f7   /* rare cards */
--accent-purple: #ce93d8   /* epic cards */
--accent-orange: #ff7043   /* legendary glow */
--text-primary:  #f0f4ff
--text-muted:    #5a6a8a
--success:       #00e676
--danger:        #ff5252
--warning:       #ffab40
```

### Card Rarity Visual Treatment
| Rarity | Gradient | Effect |
|---|---|---|
| Common | Grey diagonal split | None |
| Rare | Blue diagonal split | Subtle glow |
| Epic | Purple diagonal split | Shimmer animation |
| Legendary | Gold diagonal split | Particle + pulse animation |

### Card Design — FIFA UT inspired + FutCard custom
- Diagonal colour split background (top-left dark, bottom-right rarity colour)
- Large OVR rating top-left
- Position below OVR
- Player silhouette SVG centre (generated from position archetype)
- Name banner bottom-centre
- 5 stat bars (PAC, SHO, PAS, DRI, DEF)
- Club badge + nation flag bottom corners
- Live price bottom

---

## Data

### Player Dataset
- Phased rollout: start with an initial curated/generated seed dataset, then expand toward ~500 Premier League / international players
- Stored as `src/data/players.json`
- Fields: `id, name, club, nation, league, position, pace, shooting, passing, dribbling, defense, baseOverall`
- Stats reflect real-world relative quality (not exact FIFA numbers)

### Card Generation
- Each player entry is a template
- When a card is generated (pack open / market listing), it gets:
  - `cardId` (UUID)
  - `rarity` (rolled from pack weights)
  - Stat variance ±5 from base depending on rarity
  - `currentPrice` (calculated from rarity + overall)
  - `priceHistory[]` (max 30 points)
  - `xp: 0`, `upgradeCount: 0`

---

## IndexedDB Schema — `futcard-db` v1

| Store | Key | Indexes | Contents |
|---|---|---|---|
| `gameState` | `"singleton"` | — | coins, xp pool, managerName, onboardingDone, lastSaved |
| `collection` | `cardId` | rarity, overall, position | Player-owned cards |
| `market` | `listingId` | rarity, listPrice, position | All market listings |
| `bots` | `botId` | — | Bot state + card collections |
| `matches` | `matchId` | date, result | Match history |

Price history is persisted only within each card record as `card.priceHistory` (max 30 points), not as a standalone store.

---

## Auto-Save
- Every `$state` mutation triggers a debounced write (500ms) to IndexedDB
- On app load, `hydrate.ts` reads all IDB stores and populates `$state`
- Nav shows subtle "💾 Saved" flash on write
- Single save slot — no versioning

---

## Features

### 1. Onboarding
- First launch: "What's your name, Manager?" input
- Receive starter pack (5 common + 2 rare cards)
- Brief 3-step tooltip tour (Collection → Packs → Market)
- Stored in `gameState.onboardingDone`

### 2. Collection
- View all owned cards in responsive grid
- Filter: All / Legendary / Epic / Rare / Common
- Sort: Overall (desc) / Rarity / Value / Recently Added
- Click card → CardDetail modal (stat bars, price history, upgrade button, sell button)

### 3. Packs
| Pack | Cost | Cards | Rarity Weights |
|---|---|---|---|
| Bronze | 🪙 5,000 | 5 | Common 75% / Rare 20% / Epic 5% |
| Silver | 🪙 15,000 | 7 | Common 35% / Rare 50% / Epic 15% |
| Gold | 🪙 35,000 | 8 | Common 10% / Rare 50% / Epic 30% / Legendary 10% |
| Elite | 🪙 100,000 | 10 | Rare 15% / Epic 50% / Legendary 35% |

- Animated card reveal (staggered 200ms per card, flip animation)
- Cards added to collection on close

### 4. Transfer Market
- ~120 AI-generated listings at all times
- Replenished when cards are bought
- Filters: search name, rarity, position, price sort
- Price fluctuates every 8 seconds (±8% random walk)
- Player can list cards for sale
  - 50% chance AI buyer purchases within 2–5 seconds (simulated)
- Price ticker strip showing top legendary/epic cards

### 5. Trade Center
- 4 AI bots (reused as match opponents)
- Bot personalities affect acceptance threshold:

| Bot | Emoji | Style | Accept Threshold |
|---|---|---|---|
| TraderBot Alpha | 🤖 | Fair | 85% value match |
| GreedyBot | 💰 | Greedy | 105% (you must overpay) |
| DealBot | 🤝 | Generous | 70% |
| EliteBot | 👑 | Elite | 90%, only trades epics/legendaries |

- Max 5 cards per side
- Optional coin top-up on your side
- Fairness indicator shown before proposing
- Bot responds after 1.2s delay

### 6. Match Simulation
- Pick formation + 11 cards from collection
- Opponent = one of the 4 AI bots (their card collection = their team, auto-selected by engine)
- Formations available: 4-3-3 / 4-4-2 / 4-2-3-1 / 3-5-2 / 5-3-2
- Position assignment: flexible (any card any position, chemistry affected)
- Match runs over ~10 seconds animated

#### Match Engine Algorithm
```
Per match tick (90 ticks = 90 simulated minutes):
  attackRating  = avg(your forwards: pace + shooting + dribbling) + chemistryBonus
  defenseRating = avg(opponent defenders: defense + passing) + chemistryBonus
  eventChance   = attackRating / (attackRating + defenseRating)
  roll random → if < eventChance → attacking event
  attacking events: Goal (40%) / Shot saved (35%) / Miss (25%)
  defending events: Tackle (50%) / Yellow card (30%) / Foul (20%)
```

#### Chemistry
- Same club pair: +15
- Same nation pair: +10
- Same league pair: +5
- Playing natural position: +10
- Score 0–100, applied as 0–10% stat multiplier

#### Rewards
- Win: 🪙 coins scaled by opponent avg overall × 150, XP per card that played: +50
- Draw: 🪙 coins × 75, XP per card: +20
- Loss: 🪙 coins × 25, XP per card: +10
- Stronger opponent = higher multiplier (opponent avg OVR / 80)

#### Match Display
- Timeline feed scrolls up during 10s animation
- Events format: `"⚽ 23' — Salah scores! 1-0"`
- Final result screen: score, MOTM card highlight, rewards earned

### 7. Card Upgrades
- Each card has: `xp: number`, `upgradeCount: number` (max 10)
- XP earned: per card that played in a match (win/draw/loss rates above)
- XP earned: flat 500 XP when a card is sold from collection

#### Upgrade Options (spend card XP)
| Upgrade | XP Cost | Effect |
|---|---|---|
| Stat Boost | 500 XP | +1 to chosen stat (capped at 99) |
| Rarity Promote | 5,000 XP | Common→Rare→Epic→Legendary (visual + price boost) |

- Rarity promotion keeps `upgradeCount` tracking intact (no reset), keeps stats
- Max 10 upgrades total per card lifetime (across both types)
- Upgrade UI: modal from CardDetail, shows XP bar, available upgrades

### 8. Portfolio
- Line chart (pure SVG, no library) of total collection value over time
- X axis: time (last 30 save points)
- Y axis: total coin value of all owned cards
- Colour: green if current value > starting value, red if below
- Summary stats: total value, best card, biggest gainer, biggest loser

### 9. Dashboard
- Manager name greeting
- Coin balance + collection value
- Rarity breakdown stat boxes
- Best 5 cards preview
- Hot market listings (5 cards)
- Live price ticker

---

## PWA
- `registerType: 'autoUpdate'` — silent background updates
- `UpdatePrompt.svelte` — "🆕 Update available" banner on new deploy
- Full offline: all assets + `players.json` pre-cached by Workbox
- Manifest: `display: standalone`, `orientation: landscape` (desktop first)
- Icons: 192×192, 512×512, maskable — placeholder SVG generated by script

---

## Formations
```
4-3-3:   GK / LB CB CB RB / CM CM CM / LW ST RW
4-4-2:   GK / LB CB CB RB / LM CM CM RM / ST ST
4-2-3-1: GK / LB CB CB RB / CDM CDM / LW CAM RW / ST
3-5-2:   GK / CB CB CB / LM CDM CM CDM RM / ST ST
5-3-2:   GK / LB CB CB CB RB / CM CM CM / ST ST
```

---

## CI/CD
```yaml
Trigger: push to main
Steps:
  1. bun install
  2. bun run check   (svelte-check + tsc --noEmit)
  3. bun test        (game logic unit tests)
  4. bun run build   (vite build → dist/)
  5. Deploy dist/ → GitHub Pages
```

Deployment target is the GitHub Pages site for `joelmnz/futcard`, with Vite base set to `/futcard/`.

---

## Scripts
```json
{
  "dev":       "vite",
  "build":     "vite build",
  "preview":   "vite preview",
  "check":     "svelte-check --tsconfig ./tsconfig.json",
  "typecheck": "tsc --noEmit",
  "test":      "bun test",
  "icons":     "bun scripts/generate-icons.ts"
}
```

---

## Dependencies
```json
{
  "dependencies": {
    "svelte": "^5.0.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "typescript": "^5.0.0",
    "svelte-check": "^4.0.0",
    "workbox-window": "^7.0.0"
  }
}
```
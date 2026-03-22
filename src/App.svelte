<script lang="ts">
  import Nav from './ui/components/Nav.svelte'
  import Modal from './ui/components/Modal.svelte'
  import Button from './ui/components/Button.svelte'
  import InstallPrompt from './ui/components/InstallPrompt.svelte'
  import UpdatePrompt from './ui/components/UpdatePrompt.svelte'
  import ToastContainer from './ui/components/ToastContainer.svelte'
  import OnboardingFlow from './features/onboarding/components/OnboardingFlow.svelte'
  import CardGrid from './features/cards/components/CardGrid.svelte'
  import CardDetail from './features/cards/components/CardDetail.svelte'
  import CardComponent from './features/cards/components/Card.svelte'
  import { gameState, addCoins, spendCoins } from './core/state/game.state.svelte'
  import { collectionState, addCard, removeCard, setCards } from './core/state/collection.state.svelte'
  import { marketState, setListings, removeListing, upsertListing } from './core/state/market.state.svelte'
  import { setupAutosave } from './core/persistence/autosave.svelte'
  import type { Card, PlayerTemplate, Rarity } from './core/types/card.types'
  import type { MarketListing } from './core/types/market.types'
  import players from './data/players.json'
  import { generateCard } from './features/cards/card.generator'
  import { formatCoins } from './features/cards/card.utils'
  import { startPriceFluctuation } from './features/market/market.engine'
  import { evaluateTrade } from './features/trade/trade.ai'
  import { tradeState, setBots, setSelectedBotId } from './core/state/trade.state.svelte'
  import { simulateMatch } from './features/match/match.engine'

  setupAutosave()

  type ToastItem = {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }

  let active = $state('dashboard')
  let selectedCard = $state<Card | null>(null)
  let showCardModal = $state(false)
  let toasts = $state<ToastItem[]>([])
  let updateAvailable = $state(false)
  let ticker: ReturnType<typeof setInterval> | null = null

  // Pack reveal state
  let packRevealCards = $state<Card[]>([])
  let packRevealTitle = $state('')
  let packRevealOpen = $state(false)

  // Collection filter/sort state
  let collectionFilter = $state<'all' | Rarity>('all')
  let collectionSort = $state<'overall' | 'rarity' | 'value'>('overall')

  // Market filter state
  let marketSearch = $state('')
  let marketRarity = $state<'all' | Rarity>('all')
  let marketSort = $state<'price-asc' | 'price-desc' | 'overall'>('overall')

  // Match result state
  let matchResult = $state<{ homeScore: number; awayScore: number; rewards: { coins: number } } | null>(null)
  let matchRunning = $state(false)

  const roster = players as PlayerTemplate[]

  function toast(type: ToastItem['type'], message: string) {
    const item = { id: crypto.randomUUID(), type, message }
    toasts = [...toasts, item]
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== item.id)
    }, 3000)
  }

  function randomRarity(config?: { common: number; rare: number; epic: number; legendary?: number }): Rarity {
    if (!config) {
      const roll = Math.random()
      if (roll < 0.05) return 'legendary'
      if (roll < 0.2) return 'epic'
      if (roll < 0.55) return 'rare'
      return 'common'
    }
    const roll = Math.random()
    const total = (config.common ?? 0) + config.rare + config.epic + (config.legendary ?? 0)
    const norm = roll * total
    if (norm < (config.common ?? 0)) return 'common'
    if (norm < (config.common ?? 0) + config.rare) return 'rare'
    if (norm < (config.common ?? 0) + config.rare + config.epic) return 'epic'
    return 'legendary'
  }

  type PackType = 'bronze' | 'silver' | 'gold' | 'elite'

  const PACKS: Record<PackType, { name: string; icon: string; cost: number; cards: number; desc: string; rarityConfig: { common: number; rare: number; epic: number; legendary?: number }; borderColor: string }> = {
    bronze: {
      name: 'Bronze Pack',
      icon: '📦',
      cost: 5_000,
      cards: 5,
      desc: '5 cards • Common heavy',
      rarityConfig: { common: 75, rare: 20, epic: 5 },
      borderColor: '#cd7f32',
    },
    silver: {
      name: 'Silver Pack',
      icon: '📦',
      cost: 15_000,
      cards: 7,
      desc: '7 cards • Rare focused',
      rarityConfig: { common: 35, rare: 50, epic: 15 },
      borderColor: '#c0c0c0',
    },
    gold: {
      name: 'Gold Pack',
      icon: '📦',
      cost: 35_000,
      cards: 8,
      desc: '8 cards • Epic chance',
      rarityConfig: { common: 10, rare: 50, epic: 30, legendary: 10 },
      borderColor: '#ffd700',
    },
    elite: {
      name: 'Elite Pack',
      icon: '👑',
      cost: 100_000,
      cards: 10,
      desc: '10 cards • Legendary likely!',
      rarityConfig: { common: 0, rare: 15, epic: 50, legendary: 35 },
      borderColor: '#ff7043',
    },
  }

  function openPack(type: PackType) {
    const pack = PACKS[type]
    if (gameState.coins < pack.cost) {
      toast('error', `Need 🪙 ${formatCoins(pack.cost)} to open!`)
      return
    }
    spendCoins(pack.cost)
    const newCards: Card[] = []
    for (let i = 0; i < pack.cards; i++) {
      const template = roster[Math.floor(Math.random() * roster.length)]
      newCards.push(generateCard(template, randomRarity(pack.rarityConfig)))
    }
    packRevealCards = newCards
    packRevealTitle = pack.name
    packRevealOpen = true
  }

  function closePackReveal() {
    packRevealCards.forEach(addCard)
    packRevealCards = []
    packRevealOpen = false
  }

  function openCard(card: Card) {
    selectedCard = card
    showCardModal = true
  }

  function ensureMarket() {
    const target = 120
    if (marketState.listings.length >= target) return
    const toAdd = target - marketState.listings.length
    const fresh: MarketListing[] = []
    while (fresh.length < toAdd) {
      const template = roster[Math.floor(Math.random() * roster.length)]
      const card = generateCard(template, randomRarity())
      fresh.push({
        listingId: crypto.randomUUID(),
        card,
        listPrice: card.currentPrice,
        listedAt: Date.now(),
        isPlayerListed: false
      })
    }
    setListings([...marketState.listings, ...fresh])
  }

  function buyListing(listing: MarketListing) {
    if (listing.isPlayerListed) {
      toast('warning', 'You cannot buy your own listing.')
      return
    }
    if (gameState.coins < listing.listPrice) {
      toast('error', 'Not enough coins.')
      return
    }
    spendCoins(listing.listPrice)
    addCard(listing.card)
    removeListing(listing.listingId)
    ensureMarket()
    toast('success', `⚽ ${listing.card.name} added to your squad!`)
  }

  function listRandomCard() {
    const card = collectionState.cards[0]
    if (!card) {
      toast('warning', 'No cards to list.')
      return
    }
    removeCard(card.cardId)
    const listing: MarketListing = {
      listingId: crypto.randomUUID(),
      card,
      listPrice: card.currentPrice,
      listedAt: Date.now(),
      isPlayerListed: true
    }
    upsertListing(listing)
    toast('info', `${card.name} listed on market`)
  }

  async function playQuickMatch() {
    const team = collectionState.cards.slice(0, 11)
    const bot = tradeState.bots[0]
    if (!bot || !team.length) {
      toast('warning', 'Need cards and bots for match.')
      return
    }
    matchRunning = true
    matchResult = null
    const result = await simulateMatch(team, bot)
    matchResult = result
    matchRunning = false
    addCoins(result.rewards.coins)
    toast('success', `Full time! ${result.homeScore}-${result.awayScore}. +🪙 ${formatCoins(result.rewards.coins)}`)
  }

  function quickTrade() {
    const bot = tradeState.bots.find((b) => b.id === tradeState.selectedBotId) ?? tradeState.bots[0]
    if (!bot || collectionState.cards.length < 2) {
      toast('warning', 'Need at least 2 cards for trade.')
      return
    }
    const offer = {
      yourCards: [collectionState.cards[0]],
      botCards: [bot.cards[0]].filter(Boolean),
      coinTopUp: 0
    }
    const result = evaluateTrade(offer, bot)
    toast(result.accepted ? 'success' : 'error', result.reason)
  }

  function setupBots() {
    if (tradeState.bots.length) return
    const makeBot = (id: string, name: string, emoji: string, style: 'fair' | 'greedy' | 'generous' | 'elite') => ({
      id, name, emoji, style,
      cards: Array.from({ length: 14 }).map(() => {
        const template = roster[Math.floor(Math.random() * roster.length)]
        return generateCard(template, randomRarity())
      })
    })
    setBots([
      makeBot('alpha',  'TraderBot Alpha', '🤖', 'fair'),
      makeBot('greedy', 'GreedyBot',       '💰', 'greedy'),
      makeBot('deal',   'DealBot',         '🤝', 'generous'),
      makeBot('elite',  'EliteBot',        '👑', 'elite'),
    ])
    setSelectedBotId('alpha')
  }

  $effect(() => {
    ensureMarket()
    setupBots()
    if (!ticker) ticker = startPriceFluctuation()
  })

  // --- Derived collections ---
  const rarityOrder: Record<Rarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 }

  const filteredCollection = $derived(
    collectionState.cards
      .filter(c => collectionFilter === 'all' || c.rarity === collectionFilter)
      .sort((a, b) => {
        if (collectionSort === 'overall') return b.baseOverall - a.baseOverall
        if (collectionSort === 'rarity')  return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        if (collectionSort === 'value')   return b.currentPrice - a.currentPrice
        return 0
      })
  )

  const filteredMarket = $derived(
    marketState.listings
      .filter(l => {
        if (marketRarity !== 'all' && l.card.rarity !== marketRarity) return false
        if (marketSearch && !l.card.name.toLowerCase().includes(marketSearch.toLowerCase()) &&
            !l.card.club.toLowerCase().includes(marketSearch.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        if (marketSort === 'price-asc')  return a.listPrice - b.listPrice
        if (marketSort === 'price-desc') return b.listPrice - a.listPrice
        return b.card.baseOverall - a.card.baseOverall
      })
      .slice(0, 48)
  )

  const topCards = $derived(
    [...collectionState.cards]
      .sort((a, b) => b.baseOverall - a.baseOverall)
      .slice(0, 5)
  )

  const hotListings = $derived(
    [...marketState.listings]
      .filter(l => l.card.rarity === 'legendary' || l.card.rarity === 'epic')
      .slice(0, 5)
  )

  const portfolioValue = $derived(
    collectionState.cards.reduce((s, c) => s + c.currentPrice, 0)
  )

  const collectionByRarity = $derived({
    legendary: collectionState.cards.filter(c => c.rarity === 'legendary').length,
    epic:      collectionState.cards.filter(c => c.rarity === 'epic').length,
    rare:      collectionState.cards.filter(c => c.rarity === 'rare').length,
    common:    collectionState.cards.filter(c => c.rarity === 'common').length,
  })
</script>

{#if !gameState.onboardingDone}
  <OnboardingFlow />
{:else}
  <Nav {active} onSelect={(tab) => (active = tab)} />

  <main>
    <!-- ======================================================
         DASHBOARD
    ====================================================== -->
    {#if active === 'dashboard'}
      <div class="page">
        <!-- Hero greeting -->
        <div class="hero-greeting">
          <div class="greeting-text">
            <h1>⚽ {gameState.managerName || 'Manager'}!</h1>
            <p class="greeting-sub">Let's build a legendary squad today.</p>
          </div>
          <div class="hero-coins">
            <span class="hero-coin-label">Balance</span>
            <span class="hero-coin-amount">🪙 {formatCoins(gameState.coins)}</span>
          </div>
        </div>

        <!-- Stats boxes -->
        <div class="stat-boxes">
          <div class="stat-box">
            <span class="stat-box-val">{collectionState.cards.length}</span>
            <span class="stat-box-label">Cards</span>
          </div>
          <div class="stat-box legendary">
            <span class="stat-box-val">{collectionByRarity.legendary}</span>
            <span class="stat-box-label">Legendary</span>
          </div>
          <div class="stat-box epic">
            <span class="stat-box-val">{collectionByRarity.epic}</span>
            <span class="stat-box-label">Epic</span>
          </div>
          <div class="stat-box value">
            <span class="stat-box-val">{formatCoins(portfolioValue)}</span>
            <span class="stat-box-label">Total Value</span>
          </div>
        </div>

        <!-- Best cards -->
        {#if topCards.length}
          <div class="section-header">
            <span class="section-title">⭐ Your Best Cards</span>
          </div>
          <div class="card-row">
            {#each topCards as card (card.cardId)}
              <CardComponent {card} onclick={() => openCard(card)} />
            {/each}
          </div>
        {/if}

        <!-- Hot market -->
        {#if hotListings.length}
          <div class="section-header">
            <span class="section-title">🔥 Hot Market</span>
            <button class="section-link" onclick={() => (active = 'market')}>
              View All →
            </button>
          </div>
          <div class="card-row">
            {#each hotListings as listing (listing.listingId)}
              <div class="market-card-wrap">
                <CardComponent card={listing.card} />
                <button class="buy-overlay" onclick={() => buyListing(listing)}>
                  Buy 🪙{formatCoins(listing.listPrice)}
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Quick actions -->
        <div class="quick-actions">
          <button class="quick-btn green" onclick={() => (active = 'packs')}>
            <span class="qb-icon">📦</span>
            <span class="qb-label">Open Pack</span>
          </button>
          <button class="quick-btn blue" onclick={() => (active = 'market')}>
            <span class="qb-icon">🏦</span>
            <span class="qb-label">Market</span>
          </button>
          <button class="quick-btn purple" onclick={playQuickMatch}>
            <span class="qb-icon">⚽</span>
            <span class="qb-label">Quick Match</span>
          </button>
        </div>
      </div>
    {/if}

    <!-- ======================================================
         COLLECTION
    ====================================================== -->
    {#if active === 'collection'}
      <div class="page">
        <div class="page-header">
          <h2>🃏 My Squad</h2>
          <span class="badge">{collectionState.cards.length} cards</span>
        </div>

        <div class="filter-bar">
          <div class="rarity-filters">
            {#each (['all', 'legendary', 'epic', 'rare', 'common'] as const) as r}
              <button
                class="rarity-btn"
                class:active-filter={collectionFilter === r}
                class:legendary={r === 'legendary'}
                class:epic={r === 'epic'}
                class:rare={r === 'rare'}
                class:common={r === 'common'}
                onclick={() => (collectionFilter = r)}
              >{r === 'all' ? '🌟 All' : r.charAt(0).toUpperCase() + r.slice(1)}</button>
            {/each}
          </div>
          <select class="sort-select" bind:value={collectionSort}>
            <option value="overall">Overall ↓</option>
            <option value="rarity">Rarity ↓</option>
            <option value="value">Value ↓</option>
          </select>
        </div>

        <CardGrid cards={filteredCollection} onCardClick={openCard} />
      </div>
    {/if}

    <!-- ======================================================
         PACKS
    ====================================================== -->
    {#if active === 'packs'}
      <div class="page">
        <div class="page-header">
          <h2>📦 Pack Store</h2>
          <span class="coins-badge">🪙 {formatCoins(gameState.coins)}</span>
        </div>

        <div class="packs-grid">
          {#each Object.entries(PACKS) as [key, pack]}
            <div class="pack-card" style="--pack-color: {pack.borderColor}">
              <span class="pack-icon">{pack.icon}</span>
              <h3 class="pack-name">{pack.name}</h3>
              <p class="pack-desc">{pack.desc}</p>
              <div class="pack-weights">
                {#if (pack.rarityConfig.legendary ?? 0) > 0}
                  <span class="weight legendary">{pack.rarityConfig.legendary}% Legendary</span>
                {/if}
                {#if pack.rarityConfig.epic > 0}
                  <span class="weight epic">{pack.rarityConfig.epic}% Epic</span>
                {/if}
                <span class="weight rare">{pack.rarityConfig.rare}% Rare</span>
              </div>
              <button
                class="pack-buy-btn"
                onclick={() => openPack(key as PackType)}
                disabled={gameState.coins < pack.cost}
              >
                🪙 {formatCoins(pack.cost)}
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- ======================================================
         MARKET
    ====================================================== -->
    {#if active === 'market'}
      <div class="page">
        <div class="page-header">
          <h2>🏦 Transfer Market</h2>
          <button class="outline-btn" onclick={listRandomCard}>List a Card</button>
        </div>

        <div class="market-filters">
          <input
            class="search-input"
            type="text"
            placeholder="🔍 Search player or club..."
            bind:value={marketSearch}
          />
          <div class="rarity-filters">
            {#each (['all', 'legendary', 'epic', 'rare', 'common'] as const) as r}
              <button
                class="rarity-btn"
                class:active-filter={marketRarity === r}
                class:legendary={r === 'legendary'}
                class:epic={r === 'epic'}
                class:rare={r === 'rare'}
                class:common={r === 'common'}
                onclick={() => (marketRarity = r)}
              >{r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}</button>
            {/each}
          </div>
          <select class="sort-select" bind:value={marketSort}>
            <option value="overall">Best OVR</option>
            <option value="price-asc">Cheapest First</option>
            <option value="price-desc">Most Expensive</option>
          </select>
        </div>

        <div class="market-grid">
          {#each filteredMarket as listing (listing.listingId)}
            <div class="market-card-wrap">
              <CardComponent card={listing.card} />
              <button
                class="buy-overlay {listing.isPlayerListed ? 'own' : ''}"
                onclick={() => buyListing(listing)}
                disabled={listing.isPlayerListed}
              >
                {listing.isPlayerListed ? '📍 Listed' : `Buy 🪙${formatCoins(listing.listPrice)}`}
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- ======================================================
         TRADE
    ====================================================== -->
    {#if active === 'trade'}
      <div class="page">
        <div class="page-header">
          <h2>🤝 Trade Center</h2>
        </div>
        <p class="page-intro">Challenge an AI bot! Pick your bot, then propose a quick trade.</p>

        <div class="bot-chips">
          {#each tradeState.bots as bot}
            <button
              class="bot-chip"
              class:selected={tradeState.selectedBotId === bot.id}
              onclick={() => setSelectedBotId(bot.id)}
            >
              <span class="bot-emoji">{bot.emoji}</span>
              <span class="bot-name">{bot.name}</span>
            </button>
          {/each}
        </div>

        {#if tradeState.selectedBotId}
          {@const bot = tradeState.bots.find(b => b.id === tradeState.selectedBotId)}
          {#if bot}
            <div class="trade-arena">
              <div class="trade-side yours">
                <h3>Your Offer</h3>
                {#if collectionState.cards[0]}
                  <CardComponent card={collectionState.cards[0]} size="mini" />
                {:else}
                  <div class="empty-slot">No cards</div>
                {/if}
              </div>
              <div class="trade-vs">
                <span class="vs-icon">⇆</span>
              </div>
              <div class="trade-side bot">
                <h3>{bot.emoji} {bot.name}</h3>
                {#if bot.cards[0]}
                  <CardComponent card={bot.cards[0]} size="mini" />
                {:else}
                  <div class="empty-slot">No cards</div>
                {/if}
              </div>
            </div>
            <div class="trade-actions">
              <Button onclick={quickTrade} variant="gold">🤝 Propose Trade</Button>
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    <!-- ======================================================
         MATCH
    ====================================================== -->
    {#if active === 'match'}
      <div class="page">
        <div class="page-header">
          <h2>⚽ Match</h2>
        </div>
        <p class="page-intro">Pick your best 11 cards and take on an AI team!</p>

        {#if matchResult}
          <div class="match-result">
            <div class="match-scoreboard">
              <div class="score-team">
                <span class="score-name">You</span>
                <span class="score-num home">{matchResult.homeScore}</span>
              </div>
              <div class="score-divider">-</div>
              <div class="score-team">
                <span class="score-num away">{matchResult.awayScore}</span>
                <span class="score-name">CPU</span>
              </div>
            </div>
            <div class="match-reward">
              🪙 +{formatCoins(matchResult.rewards.coins)} earned!
            </div>
            <Button onclick={() => { matchResult = null }} variant="outline">Play Again</Button>
          </div>
        {:else}
          <div class="match-preview">
            <div class="lineup-grid">
              {#each collectionState.cards.slice(0, 11) as card (card.cardId)}
                <CardComponent {card} size="micro" />
              {/each}
            </div>
            {#if collectionState.cards.length === 0}
              <p class="hint">Open some packs first to get cards!</p>
            {/if}
          </div>

          <div class="match-kick">
            <Button onclick={playQuickMatch} disabled={matchRunning || collectionState.cards.length === 0}>
              {matchRunning ? '⏳ Playing...' : '⚽ Kick Off!'}
            </Button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- ======================================================
         PORTFOLIO
    ====================================================== -->
    {#if active === 'portfolio'}
      <div class="page">
        <div class="page-header">
          <h2>📊 Portfolio</h2>
        </div>

        <div class="portfolio-hero">
          <span class="portfolio-label">Total Collection Value</span>
          <span class="portfolio-value">🪙 {formatCoins(portfolioValue)}</span>
        </div>

        <div class="stat-boxes">
          <div class="stat-box">
            <span class="stat-box-val">{collectionState.cards.length}</span>
            <span class="stat-box-label">Total Cards</span>
          </div>
          <div class="stat-box legendary">
            <span class="stat-box-val">{collectionByRarity.legendary}</span>
            <span class="stat-box-label">Legendary</span>
          </div>
          <div class="stat-box epic">
            <span class="stat-box-val">{collectionByRarity.epic}</span>
            <span class="stat-box-label">Epic</span>
          </div>
          <div class="stat-box rare">
            <span class="stat-box-val">{collectionByRarity.rare}</span>
            <span class="stat-box-label">Rare</span>
          </div>
        </div>

        {#if topCards.length}
          <div class="section-header">
            <span class="section-title">🏆 Best Cards</span>
          </div>
          <CardGrid cards={topCards} onCardClick={openCard} />
        {/if}
      </div>
    {/if}
  </main>

  <!-- Pack Reveal Overlay -->
  {#if packRevealOpen}
    <div class="pack-overlay">
      <h2 class="pack-reveal-title">✨ {packRevealTitle} ✨</h2>
      <div class="pack-reveal-grid">
        {#each packRevealCards as card, i}
          <div
            class="reveal-card"
            style="animation-delay: {i * 180}ms; animation-duration: 0.5s"
          >
            <CardComponent {card} />
          </div>
    	  {/each}
          </div>
          <button class="keep-btn" onclick={closePackReveal}>
            🃏 Add to Collection
          </button>
    </div>
  {/if}
{/if}

<Modal open={showCardModal} onClose={() => (showCardModal = false)}>
  {#if selectedCard}<CardDetail card={selectedCard} />{/if}
</Modal>

<InstallPrompt />
<UpdatePrompt show={updateAvailable} />
<ToastContainer items={toasts} />

<style>
  main {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .page {
    display: grid;
    gap: 1.25rem;
  }

  /* ---- Page Header ---- */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .page-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--text-primary);
  }

  .page-intro {
    color: var(--text-muted);
    margin: -0.5rem 0 0;
    font-size: 0.9rem;
  }

  .badge {
    background: rgba(0, 255, 135, 0.1);
    border: 1px solid rgba(0, 255, 135, 0.3);
    border-radius: 999px;
    padding: 2px 12px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--accent-green);
  }

  .coins-badge {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.25);
    border-radius: 999px;
    padding: 4px 14px;
    font-size: 0.85rem;
    font-weight: 900;
    color: var(--accent-gold);
  }

  /* ---- Hero Greeting (Dashboard) ---- */
  .hero-greeting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #0f1e36, #152c1e);
    border: 1px solid #1e3a52;
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    gap: 1rem;
  }

  .hero-greeting h1 {
    margin: 0 0 4px;
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--accent-green);
  }

  .greeting-sub {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .hero-coins {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
  }

  .hero-coin-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .hero-coin-amount {
    font-size: 1.4rem;
    font-weight: 900;
    color: var(--accent-gold);
  }

  /* ---- Stat Boxes ---- */
  .stat-boxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 1rem;
  }

  .stat-box {
    background: var(--bg-panel);
    border: 1px solid #1e3050;
    border-radius: var(--radius-md);
    padding: 1rem;
    text-align: center;
    transition: transform 0.15s ease;
  }

  .stat-box:hover { transform: translateY(-2px); }

  .stat-box.legendary { border-color: rgba(255, 215, 0, 0.35);    background: rgba(255, 215, 0, 0.04); }
  .stat-box.epic      { border-color: rgba(206, 147, 216, 0.35);  background: rgba(206, 147, 216, 0.04); }
  .stat-box.rare      { border-color: rgba(79, 195, 247, 0.35);   background: rgba(79, 195, 247, 0.04); }
  .stat-box.value     { border-color: rgba(0, 255, 135, 0.3);     background: rgba(0, 255, 135, 0.04); }

  .stat-box-val {
    display: block;
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-box.legendary .stat-box-val { color: var(--accent-gold); }
  .stat-box.epic      .stat-box-val { color: var(--accent-purple); }
  .stat-box.rare      .stat-box-val { color: var(--accent-blue); }
  .stat-box.value     .stat-box-val { color: var(--accent-green); font-size: 1.3rem; }

  .stat-box-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  /* ---- Section header ---- */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .section-link {
    background: none;
    border: none;
    color: var(--accent-green);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }

  /* ---- Card row (responsive grid instead of horizontal scroll) ---- */
  .card-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 1rem;
    padding-bottom: 6px;
  }
  .card-row > :global(.card-wrap) {
    width: 100%;
    margin: 0;
  }

  /* ---- Market card wrap with buy overlay ---- */
  .market-card-wrap {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
  }
  .market-card-wrap > :global(.card-wrap) { width: 100%; }

  .buy-overlay {
    position: absolute;
    bottom: -44px;
    left: 0;
    right: 0;
    background: rgba(0, 255, 135, 0.92);
    color: #000;
    font-weight: 900;
    font-size: 0.78rem;
    padding: 8px;
    border: none;
    cursor: pointer;
    transition: bottom 0.18s ease;
    font-family: inherit;
  }
  .buy-overlay.own {
    background: rgba(90, 106, 138, 0.9);
    color: var(--text-primary);
    cursor: default;
  }
  .market-card-wrap:hover .buy-overlay { bottom: 0; }

  /* ---- Market grid ---- */
  .market-grid {
    display: grid;
    gap: 1.2rem;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  /* ---- Quick actions ---- */
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }

  .quick-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 1rem;
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    background: var(--bg-panel);
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .quick-btn:hover {
    transform: translateY(-3px);
  }

  .quick-btn.green { border-color: rgba(0, 255, 135, 0.35); }
  .quick-btn.green:hover { box-shadow: 0 4px 20px rgba(0,255,135,0.25); }

  .quick-btn.blue { border-color: rgba(79, 195, 247, 0.35); }
  .quick-btn.blue:hover { box-shadow: 0 4px 20px rgba(79,195,247,0.25); }

  .quick-btn.purple { border-color: rgba(206, 147, 216, 0.35); }
  .quick-btn.purple:hover { box-shadow: 0 4px 20px rgba(206,147,216,0.25); }

  .qb-icon  { font-size: 1.8rem; }
  .qb-label { font-size: 0.75rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.06em; }

  /* ---- Filter bar ---- */
  .filter-bar {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .market-filters {
    display: grid;
    gap: 0.6rem;
  }

  .rarity-filters {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .rarity-btn {
    padding: 4px 14px;
    border-radius: 999px;
    border: 1.5px solid #2a3a5a;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.12s ease;
    text-transform: capitalize;
  }

  .rarity-btn.legendary.active-filter { border-color: var(--rarity-legendary); color: var(--rarity-legendary); background: rgba(255,215,0,0.08); }
  .rarity-btn.epic.active-filter      { border-color: var(--rarity-epic);      color: var(--rarity-epic);      background: rgba(206,147,216,0.08); }
  .rarity-btn.rare.active-filter      { border-color: var(--rarity-rare);      color: var(--rarity-rare);      background: rgba(79,195,247,0.08); }
  .rarity-btn.common.active-filter    { border-color: var(--rarity-common);    color: var(--rarity-common);    background: rgba(138,148,170,0.08); }
  .rarity-btn.active-filter:not(.legendary):not(.epic):not(.rare):not(.common) {
    border-color: var(--accent-green); color: var(--accent-green); background: rgba(0,255,135,0.08);
  }

  .sort-select {
    background: var(--bg-card);
    border: 1px solid #2a3a5a;
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    padding: 5px 10px;
    font-family: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .search-input {
    background: var(--bg-card);
    border: 1px solid #253650;
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    padding: 8px 14px;
    font-family: inherit;
    font-size: 0.9rem;
    width: 100%;
    transition: border-color 0.15s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-green);
  }

  .search-input::placeholder { color: var(--text-muted); }

  /* ---- Packs ---- */
  .packs-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }

  /* Tablet: 2 columns */
  @media (min-width: 640px) {
    .packs-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Desktop: 3 columns */
  @media (min-width: 1024px) {
    .packs-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .pack-card {
    background: var(--bg-panel);
    border: 2px solid var(--pack-color, #333);
    border-radius: var(--radius-lg);
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    text-align: center;
    box-shadow: 0 4px 24px -4px color-mix(in srgb, var(--pack-color, #333) 40%, transparent);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .pack-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px -4px color-mix(in srgb, var(--pack-color, #333) 60%, transparent);
  }

  .pack-icon { font-size: 2.8rem; animation: float 3s ease-in-out infinite; }

  .pack-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 900;
    color: var(--pack-color);
  }

  .pack-desc {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .pack-weights {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .weight {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid currentColor;
  }
  .weight.legendary { color: var(--rarity-legendary); }
  .weight.epic      { color: var(--rarity-epic); }
  .weight.rare      { color: var(--rarity-rare); }

  .pack-buy-btn {
    width: 100%;
    padding: 0.7rem 1rem;
    border-radius: var(--radius-sm);
    border: 2px solid var(--pack-color);
    background: rgba(0,0,0,0.3);
    color: var(--pack-color);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 900;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.12s ease;
    margin-top: 0.3rem;
  }

  .pack-buy-btn:hover:not(:disabled) {
    background: var(--pack-color);
    color: #000;
    transform: scale(1.03);
  }

  .pack-buy-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ---- Trade ---- */
  .bot-chips {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .bot-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 1rem;
    border: 2px solid #2a3a5a;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .bot-chip:hover { border-color: var(--accent-green); color: var(--text-primary); }
  .bot-chip.selected { border-color: var(--accent-green); color: var(--accent-green); background: rgba(0,255,135,0.07); }

  .bot-emoji { font-size: 1.1rem; }
  .bot-name  { font-size: 0.8rem; }

  .trade-arena {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    align-items: center;
    background: var(--bg-panel);
    border: 1px solid #1e3050;
    border-radius: var(--radius-lg);
    padding: 1.25rem;
  }

  .trade-side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
  }

  .trade-side h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .trade-vs {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vs-icon {
    font-size: 1.8rem;
    color: var(--accent-green);
  }

  .empty-slot {
    width: 130px;
    aspect-ratio: 200/280;
    border: 2px dashed #2a3a5a;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  @media (min-width: 640px) {
    .empty-slot {
      width: 150px;
    }
  }

  @media (min-width: 1024px) {
    .empty-slot {
      width: 160px;
    }
  }

  .trade-actions {
    display: flex;
    justify-content: center;
  }

  /* ---- Match ---- */
  .match-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 2rem;
    background: var(--bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid #1e3050;
  }

  .match-scoreboard {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    font-size: 1.1rem;
  }

  .score-team {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }

  .score-name {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    text-transform: uppercase;
  }

  .score-num {
    font-size: 3rem;
    font-weight: 900;
    line-height: 1;
  }
  .score-num.home { color: var(--accent-green); }
  .score-num.away { color: var(--danger); }

  .score-divider {
    font-size: 2rem;
    color: var(--text-muted);
    font-weight: 300;
  }

  .match-reward {
    font-size: 1.1rem;
    font-weight: 900;
    color: var(--accent-gold);
    animation: bounceIn 0.5s ease;
  }

  .match-preview {
    background: var(--bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid #1e3050;
    padding: 1rem;
  }

  .lineup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.8rem;
  }

  .match-kick {
    display: flex;
    justify-content: center;
  }

  .hint {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
    margin: 1rem 0 0;
  }

  .outline-btn {
    padding: 6px 16px;
    border: 1.5px solid var(--accent-green);
    border-radius: 999px;
    background: transparent;
    color: var(--accent-green);
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .outline-btn:hover { background: rgba(0,255,135,0.08); }

  /* ---- Portfolio ---- */
  .portfolio-hero {
    background: linear-gradient(135deg, #0f1e36, #1a1200);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: var(--radius-lg);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .portfolio-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .portfolio-value {
    font-size: 2.2rem;
    font-weight: 900;
    color: var(--accent-gold);
  }

  /* ---- Pack Overlay ---- */
  .pack-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 8, 16, 0.95);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .pack-reveal-title {
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--accent-gold);
    margin: 0;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.7);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .pack-reveal-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    justify-content: center;
    max-width: 900px;
  }

  .reveal-card {
    width: 155px;
    animation: cardFlip 0.5s ease both;
  }

  .keep-btn {
    padding: 0.85rem 2.5rem;
    background: var(--accent-green);
    color: #000;
    border: none;
    border-radius: var(--radius-pill);
    font-family: inherit;
    font-size: 1.1rem;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    letter-spacing: 0.04em;
  }

  .keep-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(0, 255, 135, 0.5);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(1.03); }
  }

  @keyframes cardFlip {
    0%   { transform: perspective(800px) rotateY(90deg); opacity: 0; }
    100% { transform: perspective(800px) rotateY(0deg);  opacity: 1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }

  @keyframes bounceIn {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.1); }
    100% { transform: scale(1);   opacity: 1; }
  }
</style>

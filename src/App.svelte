<script lang="ts">
  import Nav from './ui/components/Nav.svelte'
  import Modal from './ui/components/Modal.svelte'
  import UpdatePrompt from './ui/components/UpdatePrompt.svelte'
  import ToastContainer from './ui/components/ToastContainer.svelte'
  import OnboardingFlow from './features/onboarding/components/OnboardingFlow.svelte'
  import DashboardView from './features/dashboard/components/DashboardView.svelte'
  import CollectionView from './features/collection/components/CollectionView.svelte'
  import PacksView from './features/packs/components/PacksView.svelte'
  import PackRevealOverlay from './features/packs/components/PackRevealOverlay.svelte'
  import MarketView from './features/market/components/MarketView.svelte'
  import TradeView from './features/trade/components/TradeView.svelte'
  import MatchView from './features/match/components/MatchView.svelte'
  import PortfolioView from './features/portfolio/components/PortfolioView.svelte'
  import CardDetail from './features/cards/components/CardDetail.svelte'
  import { gameState, addCoins, spendCoins } from './core/state/game.state.svelte'
  import { collectionState, addCard, removeCard } from './core/state/collection.state.svelte'
  import { marketState, setListings, removeListing, upsertListing } from './core/state/market.state.svelte'
  import { setupAutosave } from './core/persistence/autosave.svelte'
  import type { Card, PlayerTemplate, Rarity } from './core/types/card.types'
  import type { MatchResult } from './core/types/match.types'
  import type { MarketListing } from './core/types/market.types'
  import type { Bot } from './core/types/trade.types'
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

  type PackType = 'bronze' | 'silver' | 'gold' | 'elite'

  type PackDefinition = {
    name: string
    icon: string
    cost: number
    cards: number
    desc: string
    rarityConfig: { common: number; rare: number; epic: number; legendary?: number }
    borderColor: string
  }

  const PACKS: Record<PackType, PackDefinition> = {
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

  const packEntries = Object.entries(PACKS).map(([key, pack]) => ({
    key: key as PackType,
    pack,
  }))

  let active = $state('dashboard')
  let selectedCard = $state<Card | null>(null)
  let showCardModal = $state(false)
  let toasts = $state<ToastItem[]>([])
  let updateAvailable = $state(false)
  let ticker: ReturnType<typeof setInterval> | null = null

  let packRevealCards = $state<Card[]>([])
  let packRevealTitle = $state('')
  let packRevealOpen = $state(false)

  let collectionFilter = $state<'all' | Rarity>('all')
  let collectionSort = $state<'overall' | 'rarity' | 'value'>('overall')

  let marketSearch = $state('')
  let marketRarity = $state<'all' | Rarity>('all')
  let marketSort = $state<'price-asc' | 'price-desc' | 'overall'>('overall')

  let matchResult = $state<MatchResult | null>(null)
  let matchRunning = $state(false)

  const roster = players as PlayerTemplate[]

  function toast(type: ToastItem['type'], message: string) {
    const item = { id: crypto.randomUUID(), type, message }
    toasts = [...toasts, item]
    setTimeout(() => {
      toasts = toasts.filter((entry) => entry.id !== item.id)
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
    const normalized = roll * total

    if (normalized < (config.common ?? 0)) return 'common'
    if (normalized < (config.common ?? 0) + config.rare) return 'rare'
    if (normalized < (config.common ?? 0) + config.rare + config.epic) return 'epic'
    return 'legendary'
  }

  function openPack(type: PackType) {
    const pack = PACKS[type]
    if (gameState.coins < pack.cost) {
      toast('error', `Need 🪙 ${formatCoins(pack.cost)} to open!`)
      return
    }

    spendCoins(pack.cost)

    const newCards: Card[] = []
    for (let index = 0; index < pack.cards; index += 1) {
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
        isPlayerListed: false,
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

  function listCard(card: Card) {
    const ownedCard = collectionState.cards.find((owned) => owned.cardId === card.cardId)

    if (!ownedCard) {
      toast('error', 'This card is no longer in your collection')
      return false
    }

    if (marketState.listings.some((listing) => listing.card.cardId === card.cardId)) {
      toast('error', 'This card is already listed')
      return false
    }

    removeCard(card.cardId)
    upsertListing({
      listingId: crypto.randomUUID(),
      card: ownedCard,
      listPrice: ownedCard.currentPrice,
      listedAt: Date.now(),
      isPlayerListed: true,
    })
    toast('success', `📈 ${ownedCard.name} listed for ${formatCoins(ownedCard.currentPrice)}`)
    showCardModal = false
    return true
  }

  function listRandomCard() {
    const card = collectionState.cards[0]
    if (!card) {
      toast('warning', 'No cards to list.')
      return
    }

    listCard(card)
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
    const bot = tradeState.bots.find((entry) => entry.id === tradeState.selectedBotId) ?? tradeState.bots[0]

    if (!bot || collectionState.cards.length < 2) {
      toast('warning', 'Need at least 2 cards for trade.')
      return
    }

    const offer = {
      yourCards: [collectionState.cards[0]],
      botCards: bot.cards[0] ? [bot.cards[0]] : [],
      coinTopUp: 0,
    }

    const result = evaluateTrade(offer, bot)
    toast(result.accepted ? 'success' : 'error', result.reason)
  }

  function setupBots() {
    if (tradeState.bots.length) return

    const makeBot = (id: string, name: string, emoji: string, style: Bot['style']) => ({
      id,
      name,
      emoji,
      style,
      cards: Array.from({ length: 14 }).map(() => {
        const template = roster[Math.floor(Math.random() * roster.length)]
        return generateCard(template, randomRarity())
      }),
    })

    setBots([
      makeBot('alpha', 'TraderBot Alpha', '🤖', 'fair'),
      makeBot('greedy', 'GreedyBot', '💰', 'greedy'),
      makeBot('deal', 'DealBot', '🤝', 'generous'),
      makeBot('elite', 'EliteBot', '👑', 'elite'),
    ])
    setSelectedBotId('alpha')
  }

  $effect(() => {
    ensureMarket()
    setupBots()
    if (!ticker) ticker = startPriceFluctuation()
  })

  const rarityOrder: Record<Rarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 }

  const filteredCollection = $derived(
    collectionState.cards
      .filter((card) => collectionFilter === 'all' || card.rarity === collectionFilter)
      .sort((a, b) => {
        if (collectionSort === 'overall') return b.baseOverall - a.baseOverall
        if (collectionSort === 'rarity') return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        if (collectionSort === 'value') return b.currentPrice - a.currentPrice
        return 0
      })
  )

  const filteredMarket = $derived(
    marketState.listings
      .filter((listing) => {
        if (marketRarity !== 'all' && listing.card.rarity !== marketRarity) return false
        if (
          marketSearch &&
          !listing.card.name.toLowerCase().includes(marketSearch.toLowerCase()) &&
          !listing.card.club.toLowerCase().includes(marketSearch.toLowerCase())
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (marketSort === 'price-asc') return a.listPrice - b.listPrice
        if (marketSort === 'price-desc') return b.listPrice - a.listPrice
        return b.card.baseOverall - a.card.baseOverall
      })
      .slice(0, 48)
  )

  const topCards = $derived(
    [...collectionState.cards].sort((a, b) => b.baseOverall - a.baseOverall).slice(0, 5)
  )

  const hotListings = $derived(
    [...marketState.listings]
      .filter((listing) => listing.card.rarity === 'legendary' || listing.card.rarity === 'epic')
      .slice(0, 5)
  )

  const portfolioValue = $derived(collectionState.cards.reduce((sum, card) => sum + card.currentPrice, 0))

  const collectionByRarity = $derived({
    legendary: collectionState.cards.filter((card) => card.rarity === 'legendary').length,
    epic: collectionState.cards.filter((card) => card.rarity === 'epic').length,
    rare: collectionState.cards.filter((card) => card.rarity === 'rare').length,
    common: collectionState.cards.filter((card) => card.rarity === 'common').length,
  })
</script>

{#if !gameState.onboardingDone}
  <OnboardingFlow />
{:else}
  <Nav {active} onSelect={(tab) => (active = tab)} />

  <main>
    {#if active === 'dashboard'}
      <DashboardView
        managerName={gameState.managerName || 'Manager'}
        coins={gameState.coins}
        cardCount={collectionState.cards.length}
        collectionByRarity={collectionByRarity}
        portfolioValue={portfolioValue}
        topCards={topCards}
        hotListings={hotListings}
        onOpenCard={openCard}
        onBuyListing={buyListing}
        onOpenPacks={() => (active = 'packs')}
        onOpenMarket={() => (active = 'market')}
        onPlayQuickMatch={playQuickMatch}
      />
    {/if}

    {#if active === 'collection'}
      <CollectionView
        cards={filteredCollection}
        filter={collectionFilter}
        sort={collectionSort}
        onFilterChange={(value) => (collectionFilter = value)}
        onSortChange={(value) => (collectionSort = value)}
        onCardClick={openCard}
      />
    {/if}

    {#if active === 'packs'}
      <PacksView coins={gameState.coins} packs={packEntries} onOpenPack={(type) => openPack(type as PackType)} />
    {/if}

    {#if active === 'market'}
      <MarketView
        listings={filteredMarket}
        search={marketSearch}
        rarity={marketRarity}
        sort={marketSort}
        onSearchChange={(value) => (marketSearch = value)}
        onRarityChange={(value) => (marketRarity = value)}
        onSortChange={(value) => (marketSort = value)}
        onListRandomCard={listRandomCard}
        onBuyListing={buyListing}
      />
    {/if}

    {#if active === 'trade'}
      <TradeView
        bots={tradeState.bots}
        selectedBotId={tradeState.selectedBotId}
        teamCard={collectionState.cards[0] ?? null}
        onSelectBot={(id) => setSelectedBotId(id)}
        onProposeTrade={quickTrade}
      />
    {/if}

    {#if active === 'match'}
      <MatchView
        teamCards={collectionState.cards.slice(0, 11)}
        matchResult={matchResult}
        matchRunning={matchRunning}
        onPlay={playQuickMatch}
        onReset={() => {
          matchResult = null
        }}
      />
    {/if}

    {#if active === 'portfolio'}
      <PortfolioView
        portfolioValue={portfolioValue}
        cardCount={collectionState.cards.length}
        rarityCounts={collectionByRarity}
        topCards={topCards}
        onOpenCard={openCard}
      />
    {/if}
  </main>

  {#if packRevealOpen}
    <PackRevealOverlay title={packRevealTitle} cards={packRevealCards} onKeep={closePackReveal} />
  {/if}
{/if}

<Modal open={showCardModal} onClose={() => (showCardModal = false)}>
  {#if selectedCard}
    <CardDetail card={selectedCard} onSellCard={listCard} />
  {/if}
</Modal>

<UpdatePrompt show={updateAvailable} />
<ToastContainer items={toasts} />

<style>
  main {
    padding: 2rem;
    max-width: 100%;
  }
</style>
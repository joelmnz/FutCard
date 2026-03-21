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

  const roster = players as PlayerTemplate[]

  function toast(type: ToastItem['type'], message: string) {
    const item = { id: crypto.randomUUID(), type, message }
    toasts = [...toasts, item]
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== item.id)
    }, 3000)
  }

  function randomRarity(): Rarity {
    const roll = Math.random()
    if (roll < 0.05) return 'legendary'
    if (roll < 0.2) return 'epic'
    if (roll < 0.55) return 'rare'
    return 'common'
  }

  function buyPack() {
    const cost = 15_000
    if (gameState.coins < cost) {
      toast('error', 'Not enough coins.')
      return
    }
    spendCoins(cost)
    for (let i = 0; i < 7; i += 1) {
      const template = roster[Math.floor(Math.random() * roster.length)]
      addCard(generateCard(template, randomRarity()))
    }
    toast('success', 'Pack opened!')
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
    toast('success', `${listing.card.name} added to collection`)
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
    const result = await simulateMatch(team, bot)
    addCoins(result.rewards.coins)
    toast('success', `Final: ${result.homeScore}-${result.awayScore}. +${formatCoins(result.rewards.coins)} coins`)
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
      id,
      name,
      emoji,
      style,
      cards: Array.from({ length: 14 }).map(() => {
        const template = roster[Math.floor(Math.random() * roster.length)]
        return generateCard(template, randomRarity())
      })
    })

    setBots([
      makeBot('alpha', 'TraderBot Alpha', '🤖', 'fair'),
      makeBot('greedy', 'GreedyBot', '💰', 'greedy'),
      makeBot('deal', 'DealBot', '🤝', 'generous'),
      makeBot('elite', 'EliteBot', '👑', 'elite')
    ])
    setSelectedBotId('alpha')
  }

  $effect(() => {
    ensureMarket()
    setupBots()

    if (!ticker) ticker = startPriceFluctuation()
  })
</script>

{#if !gameState.onboardingDone}
  <OnboardingFlow />
{:else}
  <Nav {active} onSelect={(tab) => (active = tab)} />

  <main>
    {#if active === 'dashboard'}
      <section class="panel">
        <h2>Hello {gameState.managerName || 'Manager'}</h2>
        <p>Cards: {collectionState.cards.length} | Market: {marketState.listings.length}</p>
      </section>
      <section class="actions">
        <Button onclick={buyPack}>Buy Silver Pack (15K)</Button>
        <Button variant="outline" onclick={playQuickMatch}>Quick Match</Button>
      </section>
    {/if}

    {#if active === 'collection'}
      <section class="panel">
        <h2>Your Collection</h2>
        <CardGrid cards={collectionState.cards} onCardClick={openCard} />
      </section>
    {/if}

    {#if active === 'packs'}
      <section class="panel">
        <h2>Packs</h2>
        <Button onclick={buyPack}>Open Silver Pack</Button>
      </section>
    {/if}

    {#if active === 'market'}
      <section class="panel">
        <h2>Market</h2>
        <Button variant="outline" onclick={listRandomCard}>List First Card</Button>
        <div class="market-grid">
          {#each marketState.listings.slice(0, 20) as listing (listing.listingId)}
            <article>
              <strong>{listing.card.name}</strong>
              <p>{listing.card.rarity} - {listing.card.position}</p>
              <p>🪙 {formatCoins(listing.listPrice)}</p>
              <Button size="sm" onclick={() => buyListing(listing)}>Buy</Button>
            </article>
          {/each}
        </div>
      </section>
    {/if}

    {#if active === 'trade'}
      <section class="panel">
        <h2>Trade Center</h2>
        <div class="chips">
          {#each tradeState.bots as bot}
            <button class:active-chip={tradeState.selectedBotId === bot.id} onclick={() => setSelectedBotId(bot.id)}>
              {bot.emoji} {bot.name}
            </button>
          {/each}
        </div>
        <Button onclick={quickTrade}>Propose Quick Trade</Button>
      </section>
    {/if}

    {#if active === 'match'}
      <section class="panel">
        <h2>Match Simulator</h2>
        <Button onclick={playQuickMatch}>Kick Off</Button>
      </section>
    {/if}

    {#if active === 'portfolio'}
      <section class="panel">
        <h2>Portfolio</h2>
        <p>Total value: 🪙 {formatCoins(collectionState.cards.reduce((sum, c) => sum + c.currentPrice, 0))}</p>
      </section>
    {/if}
  </main>
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
    display: grid;
    gap: 1rem;
  }

  .panel {
    background: var(--bg-secondary);
    border: 1px solid #273b5f;
    border-radius: 14px;
    padding: 1rem;
  }

  .actions {
    display: flex;
    gap: 0.6rem;
  }

  .market-grid {
    margin-top: 1rem;
    display: grid;
    gap: 0.7rem;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  }

  .market-grid article {
    padding: 0.7rem;
    border: 1px solid #2f486f;
    border-radius: 10px;
    background: #101b30;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.7rem;
  }

  .chips button {
    border: 1px solid #2e456b;
    color: var(--text-primary);
    background: transparent;
    border-radius: 999px;
    padding: 0.35rem 0.6rem;
  }

  .active-chip {
    background: #223b61;
  }
</style>

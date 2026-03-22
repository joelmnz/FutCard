<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import type { MarketListing } from '../../../core/types/market.types'
  import CardComponent from '../../cards/components/Card.svelte'
  import { formatCoins } from '../../cards/card.utils'

  interface RarityCounts {
    legendary: number
    epic: number
    rare: number
    common: number
  }

  interface Props {
    managerName: string
    coins: number
    cardCount: number
    collectionByRarity: RarityCounts
    portfolioValue: number
    topCards: Card[]
    hotListings: MarketListing[]
    onOpenCard(card: Card): void
    onBuyListing(listing: MarketListing): void
    onOpenPacks(): void
    onOpenMarket(): void
    onPlayQuickMatch(): void
  }

  let {
    managerName,
    coins,
    cardCount,
    collectionByRarity,
    portfolioValue,
    topCards,
    hotListings,
    onOpenCard,
    onBuyListing,
    onOpenPacks,
    onOpenMarket,
    onPlayQuickMatch,
  }: Props = $props()
</script>

<div class="page">
  <div class="hero-greeting">
    <div class="greeting-text">
      <h1>⚽ {managerName || 'Manager'}!</h1>
      <p class="greeting-sub">Let's build a legendary squad today.</p>
    </div>
    <div class="hero-coins">
      <span class="hero-coin-label">Balance</span>
      <span class="hero-coin-amount">🪙 {formatCoins(coins)}</span>
    </div>
  </div>

  <div class="stat-boxes">
    <div class="stat-box">
      <span class="stat-box-val">{cardCount}</span>
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

  {#if topCards.length}
    <div class="section-header">
      <span class="section-title">⭐ Your Best Cards</span>
    </div>
    <div class="card-row">
      {#each topCards as card (card.cardId)}
        <CardComponent {card} onclick={() => onOpenCard(card)} />
      {/each}
    </div>
  {/if}

  {#if hotListings.length}
    <div class="section-header">
      <span class="section-title">🔥 Hot Market</span>
      <button class="section-link" onclick={onOpenMarket}>View All →</button>
    </div>
    <div class="card-row">
      {#each hotListings as listing (listing.listingId)}
        <div class="market-card-wrap">
          <CardComponent card={listing.card} />
          <button class="buy-overlay" onclick={() => onBuyListing(listing)}>
            Buy 🪙{formatCoins(listing.listPrice)}
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <div class="quick-actions">
    <button class="quick-btn green" onclick={onOpenPacks}>
      <span class="qb-icon">📦</span>
      <span class="qb-label">Open Pack</span>
    </button>
    <button class="quick-btn blue" onclick={onOpenMarket}>
      <span class="qb-icon">🏦</span>
      <span class="qb-label">Market</span>
    </button>
    <button class="quick-btn purple" onclick={onPlayQuickMatch}>
      <span class="qb-icon">⚽</span>
      <span class="qb-label">Quick Match</span>
    </button>
  </div>
</div>

<style>
  .page {
    display: grid;
    gap: 1.25rem;
  }

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

  .stat-box:hover {
    transform: translateY(-2px);
  }

  .stat-box.legendary { border-color: rgba(255, 215, 0, 0.35); background: rgba(255, 215, 0, 0.04); }
  .stat-box.epic { border-color: rgba(206, 147, 216, 0.35); background: rgba(206, 147, 216, 0.04); }
  .stat-box.value { border-color: rgba(0, 255, 135, 0.3); background: rgba(0, 255, 135, 0.04); }

  .stat-box-val {
    display: block;
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-box.legendary .stat-box-val { color: var(--accent-gold); }
  .stat-box.epic .stat-box-val { color: var(--accent-purple); }
  .stat-box.value .stat-box-val { color: var(--accent-green); font-size: 1.3rem; }

  .stat-box-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

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

  .card-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1.5rem;
    padding-bottom: 12px;
  }

  .card-row > :global(.card-wrap) {
    width: 100%;
    margin: 0;
  }

  .market-card-wrap {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
  }

  .market-card-wrap > :global(.card-wrap) {
    width: 100%;
  }

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

  .market-card-wrap:hover .buy-overlay {
    bottom: 0;
  }

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

  .quick-btn.green {
    border-color: rgba(0, 255, 135, 0.35);
  }

  .quick-btn.green:hover {
    box-shadow: 0 4px 20px rgba(0, 255, 135, 0.25);
  }

  .quick-btn.blue {
    border-color: rgba(79, 195, 247, 0.35);
  }

  .quick-btn.blue:hover {
    box-shadow: 0 4px 20px rgba(79, 195, 247, 0.25);
  }

  .quick-btn.purple {
    border-color: rgba(206, 147, 216, 0.35);
  }

  .quick-btn.purple:hover {
    box-shadow: 0 4px 20px rgba(206, 147, 216, 0.25);
  }

  .qb-icon {
    font-size: 1.8rem;
  }

  .qb-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
</style>
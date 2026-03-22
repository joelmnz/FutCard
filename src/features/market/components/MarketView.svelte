<script lang="ts">
  import type { Rarity } from '../../../core/types/card.types'
  import type { MarketListing } from '../../../core/types/market.types'
  import CardComponent from '../../cards/components/Card.svelte'
  import { formatCoins } from '../../cards/card.utils'

  interface Props {
    listings: MarketListing[]
    search: string
    rarity: 'all' | Rarity
    sort: 'price-asc' | 'price-desc' | 'overall'
    onSearchChange(value: string): void
    onRarityChange(value: 'all' | Rarity): void
    onSortChange(value: 'price-asc' | 'price-desc' | 'overall'): void
    onListRandomCard(): void
    onBuyListing(listing: MarketListing): void
  }

  let { listings, search, rarity, sort, onSearchChange, onRarityChange, onSortChange, onListRandomCard, onBuyListing }: Props = $props()

  const rarityLabels: Array<'all' | Rarity> = ['all', 'legendary', 'epic', 'rare', 'common']
</script>

<div class="page">
  <div class="page-header">
    <h2>🏦 Transfer Market</h2>
    <button class="outline-btn" onclick={onListRandomCard}>List a Card</button>
  </div>

  <div class="market-filters">
    <input
      class="search-input"
      type="text"
      placeholder="🔍 Search player or club..."
      value={search}
      oninput={(event) => onSearchChange((event.currentTarget as HTMLInputElement).value)}
    />

    <div class="rarity-filters">
      {#each rarityLabels as option}
        <button
          class="rarity-btn"
          class:active-filter={rarity === option}
          class:legendary={option === 'legendary'}
          class:epic={option === 'epic'}
          class:rare={option === 'rare'}
          class:common={option === 'common'}
          onclick={() => onRarityChange(option)}
        >
          {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      {/each}
    </div>

    <select class="sort-select" value={sort} onchange={(event) => onSortChange((event.currentTarget as HTMLSelectElement).value as Props['sort'])}>
      <option value="overall">Best OVR</option>
      <option value="price-asc">Cheapest First</option>
      <option value="price-desc">Most Expensive</option>
    </select>
  </div>

  <div class="market-grid">
    {#each listings as listing (listing.listingId)}
      <div class="market-card-wrap">
        <CardComponent card={listing.card} />
        <button
          class:own={listing.isPlayerListed}
          class="buy-overlay"
          onclick={() => onBuyListing(listing)}
          disabled={listing.isPlayerListed}
        >
          {listing.isPlayerListed ? '📍 Listed' : `Buy 🪙${formatCoins(listing.listPrice)}`}
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .page {
    display: grid;
    gap: 1.25rem;
  }

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

  .outline-btn:hover {
    background: rgba(0, 255, 135, 0.08);
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

  .rarity-btn.legendary.active-filter { border-color: var(--rarity-legendary); color: var(--rarity-legendary); background: rgba(255, 215, 0, 0.08); }
  .rarity-btn.epic.active-filter { border-color: var(--rarity-epic); color: var(--rarity-epic); background: rgba(206, 147, 216, 0.08); }
  .rarity-btn.rare.active-filter { border-color: var(--rarity-rare); color: var(--rarity-rare); background: rgba(79, 195, 247, 0.08); }
  .rarity-btn.common.active-filter { border-color: var(--rarity-common); color: var(--rarity-common); background: rgba(138, 148, 170, 0.08); }
  .rarity-btn.active-filter:not(.legendary):not(.epic):not(.rare):not(.common) {
    border-color: var(--accent-green);
    color: var(--accent-green);
    background: rgba(0, 255, 135, 0.08);
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

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .market-grid {
    display: grid;
    gap: 1.2rem;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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

  .buy-overlay.own {
    background: rgba(90, 106, 138, 0.9);
    color: var(--text-primary);
    cursor: default;
  }

  .market-card-wrap:hover .buy-overlay {
    bottom: 0;
  }
</style>
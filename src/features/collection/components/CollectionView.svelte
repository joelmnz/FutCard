<script lang="ts">
  import CardGrid from '../../cards/components/CardGrid.svelte'
  import type { Card, Rarity } from '../../../core/types/card.types'

  interface Props {
    cards: Card[]
    filter: 'all' | Rarity
    sort: 'overall' | 'rarity' | 'value'
    onFilterChange(value: 'all' | Rarity): void
    onSortChange(value: 'overall' | 'rarity' | 'value'): void
    onCardClick(card: Card): void
  }

  let { cards, filter, sort, onFilterChange, onSortChange, onCardClick }: Props = $props()

  const rarityLabels: Array<'all' | Rarity> = ['all', 'legendary', 'epic', 'rare', 'common']
</script>

<div class="page">
  <div class="page-header">
    <h2>🃏 My Squad</h2>
    <span class="badge">{cards.length} cards</span>
  </div>

  <div class="filter-bar">
    <div class="rarity-filters">
      {#each rarityLabels as rarity}
        <button
          class="rarity-btn"
          class:active-filter={filter === rarity}
          class:legendary={rarity === 'legendary'}
          class:epic={rarity === 'epic'}
          class:rare={rarity === 'rare'}
          class:common={rarity === 'common'}
          onclick={() => onFilterChange(rarity)}
        >
          {rarity === 'all' ? '🌟 All' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
        </button>
      {/each}
    </div>

    <select class="sort-select" value={sort} onchange={(event) => onSortChange((event.currentTarget as HTMLSelectElement).value as Props['sort'])}>
      <option value="overall">Overall ↓</option>
      <option value="rarity">Rarity ↓</option>
      <option value="value">Value ↓</option>
    </select>
  </div>

  <CardGrid {cards} onCardClick={onCardClick} />
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

  .badge {
    background: rgba(0, 255, 135, 0.1);
    border: 1px solid rgba(0, 255, 135, 0.3);
    border-radius: 999px;
    padding: 2px 12px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--accent-green);
  }

  .filter-bar {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    flex-wrap: wrap;
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
</style>
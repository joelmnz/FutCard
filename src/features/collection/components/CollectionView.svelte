<script lang="ts">
  import CardGrid from '../../cards/components/CardGrid.svelte'
  import type { Card, Rarity } from '../../../core/types/card.types'
  import PageHeader from '../../../ui/components/PageHeader.svelte'
  import RarityFilterBar from '../../../ui/components/RarityFilterBar.svelte'

  interface Props {
    cards: Card[]
    filter: 'all' | Rarity
    sort: 'overall' | 'rarity' | 'value'
    onFilterChange(value: 'all' | Rarity): void
    onSortChange(value: 'overall' | 'rarity' | 'value'): void
    onCardClick(card: Card): void
  }

  let { cards, filter, sort, onFilterChange, onSortChange, onCardClick }: Props = $props()

</script>

<div class="page">
  <PageHeader title="🃏 My Squad">
    <span class="badge">{cards.length} cards</span>
  </PageHeader>

  <div class="filter-bar">
    <RarityFilterBar value={filter} onChange={onFilterChange} allLabel="🌟 All" />

    <select class="sort-select" value={sort} onchange={(event) => onSortChange((event.currentTarget as HTMLSelectElement).value as Props['sort'])}>
      <option value="overall">Overall ↓</option>
      <option value="rarity">Rarity ↓</option>
      <option value="value">Value ↓</option>
    </select>
  </div>

  <CardGrid {cards} onCardClick={onCardClick} />
</div>

<style>
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
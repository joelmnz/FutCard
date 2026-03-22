<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import CardGrid from '../../cards/components/CardGrid.svelte'
  import { formatCoins } from '../../cards/card.utils'
  import PageHeader from '../../../ui/components/PageHeader.svelte'
  import StatBoxGrid from '../../../ui/components/StatBoxGrid.svelte'
  import StatBox from '../../../ui/components/StatBox.svelte'

  interface RarityCounts {
    legendary: number
    epic: number
    rare: number
    common: number
  }

  interface Props {
    portfolioValue: number
    cardCount: number
    rarityCounts: RarityCounts
    topCards: Card[]
    onOpenCard(card: Card): void
  }

  let { portfolioValue, cardCount, rarityCounts, topCards, onOpenCard }: Props = $props()
</script>

<div class="page">
  <PageHeader title="📊 Portfolio" />

  <div class="portfolio-hero">
    <span class="portfolio-label">Total Collection Value</span>
    <span class="portfolio-value">🪙 {formatCoins(portfolioValue)}</span>
  </div>

  <StatBoxGrid>
    <StatBox value={cardCount} label="Total Cards" />
    <StatBox value={rarityCounts.legendary} label="Legendary" variant="legendary" />
    <StatBox value={rarityCounts.epic} label="Epic" variant="epic" />
    <StatBox value={rarityCounts.rare} label="Rare" variant="rare" />
  </StatBoxGrid>

  {#if topCards.length}
    <PageHeader variant="section" title="🏆 Best Cards" />
    <CardGrid cards={topCards} onCardClick={onOpenCard} />
  {/if}
</div>

<style>
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

</style>
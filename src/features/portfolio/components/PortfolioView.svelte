<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import CardGrid from '../../cards/components/CardGrid.svelte'
  import { formatCoins } from '../../cards/card.utils'

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
  <div class="page-header">
    <h2>📊 Portfolio</h2>
  </div>

  <div class="portfolio-hero">
    <span class="portfolio-label">Total Collection Value</span>
    <span class="portfolio-value">🪙 {formatCoins(portfolioValue)}</span>
  </div>

  <div class="stat-boxes">
    <div class="stat-box">
      <span class="stat-box-val">{cardCount}</span>
      <span class="stat-box-label">Total Cards</span>
    </div>
    <div class="stat-box legendary">
      <span class="stat-box-val">{rarityCounts.legendary}</span>
      <span class="stat-box-label">Legendary</span>
    </div>
    <div class="stat-box epic">
      <span class="stat-box-val">{rarityCounts.epic}</span>
      <span class="stat-box-label">Epic</span>
    </div>
    <div class="stat-box rare">
      <span class="stat-box-val">{rarityCounts.rare}</span>
      <span class="stat-box-label">Rare</span>
    </div>
  </div>

  {#if topCards.length}
    <div class="section-header">
      <span class="section-title">🏆 Best Cards</span>
    </div>
    <CardGrid cards={topCards} onCardClick={onOpenCard} />
  {/if}
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
  .stat-box.rare { border-color: rgba(79, 195, 247, 0.35); background: rgba(79, 195, 247, 0.04); }

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
  .stat-box.rare .stat-box-val { color: var(--accent-blue); }

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
</style>
<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import { formatCoins } from '../card.utils'
  import CardComponent from './Card.svelte'

  let { card, onSellCard }: { card: Card; onSellCard?: (card: Card) => void } = $props()

  const stats = $derived([
    { label: 'PAC', value: card.pace,      color: '#4fc3f7' },
    { label: 'SHO', value: card.shooting,  color: '#ff7043' },
    { label: 'PAS', value: card.passing,   color: '#00ff87' },
    { label: 'DRI', value: card.dribbling, color: '#ce93d8' },
    { label: 'DEF', value: card.defense,   color: '#ffd700' },
  ])

  const rarityLabel: Record<string, string> = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  }
</script>

<div class="detail-layout">
  <!-- Card preview -->
  <div class="card-preview">
    <CardComponent {card} size="full" />
  </div>

  <!-- Info panel -->
  <div class="detail-info">
    <div class="detail-header">
      <h2 class="detail-name">{card.name}</h2>
      <span class="detail-rarity {card.rarity}">{rarityLabel[card.rarity]}</span>
    </div>
    <div class="detail-meta">
      <span>📍 {card.position}</span>
      <span>🏆 {card.club}</span>
      <span>🏳️ {card.nation}</span>
    </div>

    <div class="stats-list">
      {#each stats as s}
        <div class="stat-row">
          <span class="stat-label">{s.label}</span>
          <div class="stat-bar-bg">
            <div
              class="stat-bar-fill"
              style="width: {(s.value / 99) * 100}%; background: {s.color}"
            ></div>
          </div>
          <span class="stat-val">{s.value}</span>
        </div>
      {/each}
    </div>

    <div class="value-display">
      <div class="value-copy">
        <span class="value-label">Market Value</span>
        <span class="value-amount">🪙 {formatCoins(card.currentPrice)}</span>
      </div>
      {#if onSellCard}
        <button class="sell-button" type="button" onclick={() => onSellCard(card)}>
          Sell
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .detail-layout {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 500px) {
    .detail-layout { grid-template-columns: 1fr; }
    .card-preview { max-width: 160px; margin: 0 auto; }
  }

  .card-preview { width: 180px; }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .detail-name {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 900;
    color: var(--text-primary);
  }

  .detail-rarity {
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1.5px solid currentColor;
  }
  .common    { color: var(--rarity-common); }
  .rare      { color: var(--rarity-rare); }
  .epic      { color: var(--rarity-epic); }
  .legendary { color: var(--rarity-legendary); }

  .detail-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .stats-list {
    display: grid;
    gap: 0.6rem;
    margin-bottom: 1.2rem;
  }

  .stat-row {
    display: grid;
    grid-template-columns: 36px 1fr 30px;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-bar-bg {
    height: 8px;
    background: rgba(255,255,255,0.08);
    border-radius: 999px;
    overflow: hidden;
  }

  .stat-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s var(--ease-out-quart, ease);
  }

  .stat-val {
    font-size: 0.8rem;
    font-weight: 900;
    color: var(--text-primary);
    text-align: right;
  }

  .value-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    background: rgba(255, 215, 0, 0.07);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 10px;
    padding: 0.6rem 1rem;
  }

  .value-copy {
    display: grid;
    gap: 0.15rem;
  }

  .value-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .value-amount {
    font-size: 1.1rem;
    font-weight: 900;
    color: var(--accent-gold);
  }

  .sell-button {
    appearance: none;
    border: 1px solid rgba(255, 215, 0, 0.35);
    background: rgba(255, 215, 0, 0.12);
    color: var(--text-primary);
    border-radius: 999px;
    padding: 0.55rem 0.9rem;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
    transition:
      transform 180ms var(--ease-out-quart, ease),
      background 180ms var(--ease-out-quart, ease),
      border-color 180ms var(--ease-out-quart, ease);
  }

  .sell-button:hover {
    transform: translateY(-1px);
    background: rgba(255, 215, 0, 0.18);
    border-color: rgba(255, 215, 0, 0.5);
  }

  .sell-button:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 2px;
  }
</style>

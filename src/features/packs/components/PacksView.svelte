<script lang="ts">
  import { formatCoins } from '../../cards/card.utils'

  interface PackDefinition {
    name: string
    icon: string
    cost: number
    cards: number
    desc: string
    rarityConfig: { common: number; rare: number; epic: number; legendary?: number }
    borderColor: string
  }

  interface PackEntry {
    key: string
    pack: PackDefinition
  }

  interface Props {
    coins: number
    packs: PackEntry[]
    onOpenPack(type: string): void
  }

  let { coins, packs, onOpenPack }: Props = $props()
</script>

<div class="page">
  <div class="page-header">
    <h2>📦 Pack Store</h2>
    <span class="coins-badge">🪙 {formatCoins(coins)}</span>
  </div>

  <div class="packs-grid">
    {#each packs as { key, pack }}
      <div class="pack-card" style={`--pack-color: ${pack.borderColor}`}>
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
        <button class="pack-buy-btn" onclick={() => onOpenPack(key)}>
          🪙 {formatCoins(pack.cost)}
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

  .coins-badge {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.25);
    border-radius: 999px;
    padding: 4px 14px;
    font-size: 0.85rem;
    font-weight: 900;
    color: var(--accent-gold);
  }

  .packs-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 640px) {
    .packs-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

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

  .pack-icon {
    font-size: 2.8rem;
    animation: float 3s ease-in-out infinite;
  }

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

  .weight.legendary {
    color: var(--rarity-legendary);
  }

  .weight.epic {
    color: var(--rarity-epic);
  }

  .weight.rare {
    color: var(--rarity-rare);
  }

  .pack-buy-btn {
    width: 100%;
    padding: 0.7rem 1rem;
    border-radius: var(--radius-sm);
    border: 2px solid var(--pack-color);
    background: rgba(0, 0, 0, 0.3);
    color: var(--pack-color);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 900;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.12s ease;
    margin-top: 0.3rem;
  }

  .pack-buy-btn:hover {
    background: var(--pack-color);
    color: #000;
    transform: scale(1.03);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
</style>
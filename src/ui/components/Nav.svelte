<script lang="ts">
  import { gameState } from '../../core/state/game.state.svelte'
  import { formatCoins } from '../../features/cards/card.utils'

  let { active = 'dashboard', onSelect }: {
    active?: string
    onSelect: (tab: string) => void
  } = $props()

  const tabs = [
    { id: 'dashboard',  icon: '🏠', label: 'Home' },
    { id: 'collection', icon: '🃏', label: 'Cards' },
    { id: 'packs',      icon: '📦', label: 'Packs' },
    { id: 'market',     icon: '🏦', label: 'Market' },
    { id: 'trade',      icon: '🤝', label: 'Trade' },
    { id: 'match',      icon: '⚽', label: 'Match' },
    { id: 'portfolio',  icon: '📊', label: 'Stats' },
  ]
</script>

<nav>
  <div class="logo">⚽ <span>FutCard</span></div>

  <div class="tabs">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={tab.id === active}
        onclick={() => onSelect(tab.id)}
        title={tab.label}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </div>

  <div class="coins-display">
    <span class="coin-icon">🪙</span>
    <span class="coin-amount">{formatCoins(gameState.coins)}</span>
  </div>
</nav>

<style>
  nav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
    background: var(--bg-panel);
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #1e2f4a;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  .logo {
    font-size: 1.3rem;
    font-weight: 900;
    color: var(--accent-green);
    display: flex;
    align-items: center;
    gap: 0.35rem;
    letter-spacing: 0.04em;
    text-shadow: 0 0 16px rgba(0, 255, 135, 0.4);
    white-space: nowrap;
  }

  .logo span {
    display: none;
  }

  @media (min-width: 600px) {
    .logo span { display: inline; }
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 0.2rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar { display: none; }

  .tab-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0.3rem 0.55rem;
    border: 0;
    background: transparent;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, transform 0.12s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tab-btn:hover {
    color: var(--text-primary);
    background: rgba(255,255,255,0.05);
    transform: translateY(-1px);
  }

  .tab-btn.active {
    color: var(--accent-green);
    background: rgba(0, 255, 135, 0.08);
    text-shadow: 0 0 12px rgba(0, 255, 135, 0.5);
  }

  .tab-icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  .tab-label {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .coins-display {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.25);
    border-radius: var(--radius-pill);
    padding: 0.35rem 0.8rem;
    white-space: nowrap;
  }

  .coin-icon { font-size: 1rem; }

  .coin-amount {
    font-size: 0.95rem;
    font-weight: 900;
    color: var(--accent-gold);
  }
</style>

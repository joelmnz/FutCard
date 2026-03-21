<script lang="ts">
  import { gameState } from '../../core/state/game.state.svelte'
  import { formatCoins } from '../../features/cards/card.utils'

  export let active = 'dashboard'
  export let onSelect: (tab: string) => void = () => {}

  const tabs = ['dashboard', 'collection', 'packs', 'market', 'trade', 'match', 'portfolio']
</script>

<nav>
  <h1>FutCard</h1>
  <div class="tabs">
    {#each tabs as tab}
      <button class:active={tab === active} on:click={() => onSelect(tab)}>{tab}</button>
    {/each}
  </div>
  <div class="coins">🪙 {formatCoins(gameState.coins)}</div>
</nav>

<style>
  nav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
    background: var(--bg-panel);
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid #223251;
    position: sticky;
    top: 0;
    z-index: 20;
  }

  h1 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--accent-green);
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  button {
    border: 0;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    text-transform: capitalize;
  }

  button.active {
    color: var(--text-primary);
    background: #223253;
  }

  .coins { font-weight: 700; }
</style>

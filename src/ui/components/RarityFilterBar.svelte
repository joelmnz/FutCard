<script lang="ts">
  import type { Rarity } from '../../core/types/card.types'

  interface Props {
    value: 'all' | Rarity
    onChange(value: 'all' | Rarity): void
    allLabel?: string
  }

  let { value, onChange, allLabel = 'All' }: Props = $props()

  const rarities: Array<'all' | Rarity> = ['all', 'legendary', 'epic', 'rare', 'common']
</script>

<div class="rarity-filters">
  {#each rarities as rarity}
    <button
      class="rarity-btn"
      class:active-filter={value === rarity}
      class:legendary={rarity === 'legendary'}
      class:epic={rarity === 'epic'}
      class:rare={rarity === 'rare'}
      class:common={rarity === 'common'}
      onclick={() => onChange(rarity)}
    >
      {rarity === 'all' ? allLabel : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
    </button>
  {/each}
</div>

<style>
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
</style>
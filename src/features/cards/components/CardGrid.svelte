<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import CardComponent from './Card.svelte'
  export let cards: Card[] = []
  export let onCardClick: (card: Card) => void = () => {}
</script>

{#if cards.length}
  <div class="grid">
    {#each cards as card (card.cardId)}
      <button class="item" on:click={() => onCardClick(card)}>
        <CardComponent {card} />
      </button>
    {/each}
  </div>
{:else}
  <slot>
    <p>No cards yet.</p>
  </slot>
{/if}

<style>
  .grid {
    display: grid;
    gap: 0.8rem;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  }
  .item {
    border: 0;
    background: transparent;
    padding: 0;
  }
</style>

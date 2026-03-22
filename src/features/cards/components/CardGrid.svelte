<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import CardComponent from './Card.svelte'

  let { cards = [], onCardClick }: {
    cards?: Card[]
    onCardClick?: (card: Card) => void
  } = $props()
</script>

{#if cards.length}
  <div class="grid">
    {#each cards as card, i (card.cardId)}
      <div
        class="card-entry"
        style="animation-delay: {Math.min(i * 60, 600)}ms"
      >
        <CardComponent {card} onclick={onCardClick ? () => onCardClick(card) : undefined} />
      </div>
    {/each}
  </div>
{:else}
  <div class="empty-state">
    <span class="empty-icon">🃏</span>
    <p>No cards yet</p>
  </div>
{/if}

<style>
  .grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .card-entry {
    animation: bounceIn 0.4s var(--ease-spring, ease) both;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.4;
  }
</style>

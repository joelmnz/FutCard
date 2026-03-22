<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import CardComponent from '../../cards/components/Card.svelte'

  interface Props {
    title: string
    cards: Card[]
    onKeep(): void
  }

  let { title, cards, onKeep }: Props = $props()
</script>

<div class="pack-overlay">
  <h2 class="pack-reveal-title">✨ {title} ✨</h2>
  <div class="pack-reveal-grid">
    {#each cards as card, index}
      <div class="reveal-card" style={`animation-delay: ${index * 180}ms; animation-duration: 0.5s`}>
        <CardComponent {card} />
      </div>
    {/each}
  </div>
  <button class="keep-btn" onclick={onKeep}>🃏 Add to Collection</button>
</div>

<style>
  .pack-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 8, 16, 0.95);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .pack-reveal-title {
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--accent-gold);
    margin: 0;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.7);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .pack-reveal-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    justify-content: center;
    max-width: 900px;
  }

  .reveal-card {
    width: 155px;
    animation: cardFlip 0.5s ease both;
  }

  .keep-btn {
    padding: 0.85rem 2.5rem;
    background: var(--accent-green);
    color: #000;
    border: none;
    border-radius: var(--radius-pill);
    font-family: inherit;
    font-size: 1.1rem;
    font-weight: 900;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    letter-spacing: 0.04em;
  }

  .keep-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(0, 255, 135, 0.5);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.03); }
  }

  @keyframes cardFlip {
    0% { transform: perspective(800px) rotateY(90deg); opacity: 0; }
    100% { transform: perspective(800px) rotateY(0deg); opacity: 1; }
  }
</style>
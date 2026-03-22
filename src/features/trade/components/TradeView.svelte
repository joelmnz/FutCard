<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import type { Bot } from '../../../core/types/trade.types'
  import CardComponent from '../../cards/components/Card.svelte'
  import Button from '../../../ui/components/Button.svelte'

  interface Props {
    bots: Bot[]
    selectedBotId: string | null
    teamCard: Card | null
    onSelectBot(id: string): void
    onProposeTrade(): void
  }

  let { bots, selectedBotId, teamCard, onSelectBot, onProposeTrade }: Props = $props()

  const selectedBot = $derived(bots.find((bot) => bot.id === selectedBotId) ?? null)
</script>

<div class="page">
  <div class="page-header">
    <h2>🤝 Trade Center</h2>
  </div>
  <p class="page-intro">Challenge an AI bot! Pick your bot, then propose a quick trade.</p>

  <div class="bot-chips">
    {#each bots as bot}
      <button class="bot-chip" class:selected={selectedBotId === bot.id} onclick={() => onSelectBot(bot.id)}>
        <span class="bot-emoji">{bot.emoji}</span>
        <span class="bot-name">{bot.name}</span>
      </button>
    {/each}
  </div>

  {#if selectedBot}
    <div class="trade-arena">
      <div class="trade-side yours">
        <h3>Your Offer</h3>
        {#if teamCard}
          <CardComponent card={teamCard} size="mini" />
        {:else}
          <div class="empty-slot">No cards</div>
        {/if}
      </div>

      <div class="trade-vs">
        <span class="vs-icon">⇆</span>
      </div>

      <div class="trade-side bot">
        <h3>{selectedBot.emoji} {selectedBot.name}</h3>
        {#if selectedBot.cards[0]}
          <CardComponent card={selectedBot.cards[0]} size="mini" />
        {:else}
          <div class="empty-slot">No cards</div>
        {/if}
      </div>
    </div>

    <div class="trade-actions">
      <Button onclick={onProposeTrade} variant="gold">🤝 Propose Trade</Button>
    </div>
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

  .page-intro {
    color: var(--text-muted);
    margin: -0.5rem 0 0;
    font-size: 0.9rem;
  }

  .bot-chips {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .bot-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 1rem;
    border: 2px solid #2a3a5a;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .bot-chip:hover {
    border-color: var(--accent-green);
    color: var(--text-primary);
  }

  .bot-chip.selected {
    border-color: var(--accent-green);
    color: var(--accent-green);
    background: rgba(0, 255, 135, 0.07);
  }

  .bot-emoji {
    font-size: 1.1rem;
  }

  .bot-name {
    font-size: 0.8rem;
  }

  .trade-arena {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    align-items: center;
    background: var(--bg-panel);
    border: 1px solid #1e3050;
    border-radius: var(--radius-lg);
    padding: 1.25rem;
  }

  .trade-side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
  }

  .trade-side h3 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .trade-vs {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vs-icon {
    font-size: 1.8rem;
    color: var(--accent-green);
  }

  .empty-slot {
    width: 130px;
    aspect-ratio: 200 / 280;
    border: 2px dashed #2a3a5a;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  @media (min-width: 640px) {
    .empty-slot {
      width: 150px;
    }
  }

  @media (min-width: 1024px) {
    .empty-slot {
      width: 160px;
    }
  }

  .trade-actions {
    display: flex;
    justify-content: center;
  }
</style>
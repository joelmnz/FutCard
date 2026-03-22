<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import type { MatchResult } from '../../../core/types/match.types'
  import CardComponent from '../../cards/components/Card.svelte'
  import { formatCoins } from '../../cards/card.utils'
  import Button from '../../../ui/components/Button.svelte'
  import PageHeader from '../../../ui/components/PageHeader.svelte'

  interface Props {
    teamCards: Card[]
    matchResult: MatchResult | null
    matchRunning: boolean
    onPlay(): void
    onReset(): void
  }

  let { teamCards, matchResult, matchRunning, onPlay, onReset }: Props = $props()
</script>

<div class="page">
  <PageHeader title="⚽ Match" subtitle="Pick your best 11 cards and take on an AI team!" />

  {#if matchResult}
    <div class="match-result">
      <div class="match-scoreboard">
        <div class="score-team">
          <span class="score-name">You</span>
          <span class="score-num home">{matchResult.homeScore}</span>
        </div>
        <div class="score-divider">-</div>
        <div class="score-team">
          <span class="score-num away">{matchResult.awayScore}</span>
          <span class="score-name">CPU</span>
        </div>
      </div>
      <div class="match-reward">🪙 +{formatCoins(matchResult.rewards.coins)} earned!</div>
      <Button onclick={onReset} variant="outline">Play Again</Button>
    </div>
  {:else}
    <div class="match-preview">
      <div class="lineup-grid">
        {#each teamCards as card (card.cardId)}
          <CardComponent {card} size="micro" />
        {/each}
      </div>
      {#if teamCards.length === 0}
        <p class="hint">Open some packs first to get cards!</p>
      {/if}
    </div>

    <div class="match-kick">
      <Button onclick={onPlay} disabled={matchRunning || teamCards.length === 0}>
        {matchRunning ? '⏳ Playing...' : '⚽ Kick Off!'}
      </Button>
    </div>
  {/if}
</div>

<style>
  .match-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 2rem;
    background: var(--bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid #1e3050;
  }

  .match-scoreboard {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    font-size: 1.1rem;
  }

  .score-team {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }

  .score-name {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    text-transform: uppercase;
  }

  .score-num {
    font-size: 3rem;
    font-weight: 900;
    line-height: 1;
  }

  .score-num.home {
    color: var(--accent-green);
  }

  .score-num.away {
    color: var(--danger);
  }

  .score-divider {
    font-size: 2rem;
    color: var(--text-muted);
    font-weight: 300;
  }

  .match-reward {
    font-size: 1.1rem;
    font-weight: 900;
    color: var(--accent-gold);
    animation: bounceIn 0.5s ease;
  }

  .match-preview {
    background: var(--bg-panel);
    border-radius: var(--radius-lg);
    border: 1px solid #1e3050;
    padding: 1rem;
  }

  .lineup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.8rem;
  }

  .match-kick {
    display: flex;
    justify-content: center;
  }

  .hint {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
    margin: 1rem 0 0;
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }

    60% {
      transform: scale(1.1);
    }

    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
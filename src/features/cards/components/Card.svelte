<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import { formatCoins, getPositionArchetype } from '../card.utils'

  let { card, size = 'full', onclick }: {
    card: Card
    size?: 'full' | 'mini' | 'micro'
    onclick?: () => void
  } = $props()

  const archetypeEmoji: Record<string, string> = {
    goalkeeper: '🧤',
    defender:   '🛡️',
    midfielder: '⚡',
    attacker:   '⚽',
  }
  const emoji = $derived(archetypeEmoji[getPositionArchetype(card.position)] ?? '⚽')
  const lastName = $derived(card.name.split(' ').slice(-1)[0])
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="card-wrap {card.rarity} {size}"
  onclick={onclick}
  style={onclick ? 'cursor:pointer' : ''}
>
  <div class="card-bg"></div>
  {#if card.rarity === 'epic' || card.rarity === 'legendary'}
    <div class="shimmer-overlay"></div>
  {/if}

  <div class="card-content">
    <!-- OVR + Position -->
    <div class="card-header">
      <div class="ovr-block">
        <span class="ovr-number">{card.baseOverall}</span>
        <span class="ovr-pos">{card.position}</span>
      </div>
      <div class="rarity-badge {card.rarity}">{card.rarity[0].toUpperCase()}</div>
    </div>

    <!-- Avatar -->
    <div class="card-avatar">
      <div class="avatar-inner">
        <span class="avatar-emoji">{emoji}</span>
      </div>
    </div>

    <!-- Name -->
    <div class="name-banner">
      <span class="player-name">{lastName}</span>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat"><span class="sl">PAC</span><span class="sv">{card.pace}</span></div>
      <div class="stat"><span class="sl">SHO</span><span class="sv">{card.shooting}</span></div>
      <div class="stat"><span class="sl">PAS</span><span class="sv">{card.passing}</span></div>
      <div class="stat"><span class="sl">DRI</span><span class="sv">{card.dribbling}</span></div>
      <div class="stat"><span class="sl">DEF</span><span class="sv">{card.defense}</span></div>
    </div>

    <!-- Footer -->
    <div class="card-footer">
      <span class="footer-side">{card.nation}</span>
      <span class="footer-price">🪙{formatCoins(card.currentPrice)}</span>
      <span class="footer-side club-abbr">{card.club.slice(0, 3).toUpperCase()}</span>
    </div>
  </div>
</div>

<style>
  /* ---- Wrapper ---- */
  .card-wrap {
    container-type: inline-size;
    position: relative;
    aspect-ratio: 200 / 280;
    border-radius: 16px;
    overflow: hidden;
    user-select: none;
    transition: transform 0.18s var(--ease-out-quart, ease),
                box-shadow 0.18s var(--ease-out-quart, ease);
    border: 2px solid transparent;
    flex-shrink: 0;
  }

  .card-wrap:hover {
    transform: translateY(-6px) scale(1.04);
  }

  /* ---- Rarity backgrounds ---- */
  .card-bg {
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }
  .common .card-bg  { background: var(--card-common-bg); }
  .rare   .card-bg  { background: var(--card-rare-bg); }
  .epic   .card-bg  { background: var(--card-epic-bg); }
  .legendary .card-bg { background: var(--card-legendary-bg); }

  /* ---- Rarity glow borders ---- */
  .common    { border-color: var(--rarity-common);    box-shadow: var(--glow-common); }
  .rare      { border-color: var(--rarity-rare);      box-shadow: var(--glow-rare); }
  .epic      { border-color: var(--rarity-epic);      box-shadow: var(--glow-epic);
               animation: epicPulse 2.5s ease-in-out infinite; }
  .legendary { border-color: var(--rarity-legendary); box-shadow: var(--glow-legendary);
               animation: legendaryPulse 2s ease-in-out infinite; }

  /* ---- Shimmer overlay ---- */
  .shimmer-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 35%,
      rgba(255, 255, 255, 0.22) 50%,
      transparent 65%
    );
    animation: shimmer 2.6s ease-in-out infinite;
    pointer-events: none;
    z-index: 2;
  }

  /* ---- Content ---- */
  .card-content {
    position: relative;
    z-index: 3;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: clamp(6px, 5cqi, 12px) clamp(6px, 5cqi, 12px) clamp(5px, 4cqi, 10px);
    gap: 0;
  }

  /* ---- Header ---- */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .ovr-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1;
  }

  .ovr-number {
    font-size: 1.9em;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    line-height: 1;
  }

  .ovr-pos {
    font-size: 0.62em;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .rarity-badge {
    width: 1.4em;
    height: 1.4em;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65em;
    font-weight: 900;
    border: 1.5px solid currentColor;
  }
  .rarity-badge.common    { color: var(--rarity-common); }
  .rarity-badge.rare      { color: var(--rarity-rare); }
  .rarity-badge.epic      { color: var(--rarity-epic); }
  .rarity-badge.legendary { color: var(--rarity-legendary); }

  /* ---- Avatar ---- */
  .card-avatar {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 0;
  }

  .avatar-inner {
    width: 52%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: rgba(0,0,0,0.3);
    border: 2px solid rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-emoji {
    font-size: 2.1em;
    line-height: 1;
  }

  /* ---- Name ---- */
  .name-banner {
    background: rgba(0,0,0,0.5);
    border-radius: 5px;
    padding: 2px 5px;
    text-align: center;
    margin: 2px 0;
  }

  .player-name {
    font-size: 0.76em;
    font-weight: 900;
    color: #fff;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---- Stats row ---- */
  .stats-row {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.14);
    padding-top: 4px;
    margin-top: 2px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    gap: 1px;
  }

  .sl {
    font-size: 0.48em;
    color: rgba(255,255,255,0.55);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .sv {
    font-size: 0.72em;
    font-weight: 900;
    color: #fff;
    line-height: 1;
  }

  /* ---- Footer ---- */
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 3px;
    margin-top: 2px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }

  .footer-side {
    font-size: 0.52em;
    color: rgba(255,255,255,0.65);
    font-weight: 600;
  }

  .footer-price {
    font-size: 0.66em;
    font-weight: 900;
    color: var(--accent-gold);
  }

  .club-abbr {
    font-size: 0.5em;
    letter-spacing: 0.05em;
  }

  /* ---- Size variants ---- */
  .full  { width: 100%; max-width: none; font-size: clamp(14px, 7cqi, 18px); margin: 0; }
  
  .mini  { width: 100%; max-width: 280px; font-size: clamp(12px, 7cqi, 16px); margin: 0 auto; }
  
  .micro { width: 100%; max-width: 140px; font-size: clamp(9px, 7cqi, 12px); margin: 0 auto; }
</style>

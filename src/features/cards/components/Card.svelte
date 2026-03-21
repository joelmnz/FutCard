<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import { getRarityColour } from '../card.utils'
  export let card: Card
  export let size: 'full' | 'mini' | 'micro' = 'full'
</script>

<svg class={`card ${size}`} viewBox="0 0 200 280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#101827" />
      <stop offset="100%" stop-color={getRarityColour(card.rarity)} />
    </linearGradient>
  </defs>

  <rect x="5" y="5" width="190" height="270" rx="18" fill="url(#bg)" stroke="#eaf1ff22" />
  <text x="20" y="44" fill="#fff" font-size="28" font-weight="800">{card.baseOverall}</text>
  <text x="20" y="61" fill="#d4deef" font-size="12">{card.position}</text>
  <circle cx="100" cy="110" r="42" fill="#ffffff1a" />
  <text x="100" y="115" text-anchor="middle" fill="#fff">⚽</text>
  <rect x="18" y="170" width="164" height="28" rx="6" fill="#0d1527aa" />
  <text x="100" y="188" text-anchor="middle" fill="#fff" font-size="13">{card.name}</text>
  <text x="20" y="258" fill="#ecf2ff" font-size="12">{card.nation}</text>
  <text x="180" y="258" text-anchor="end" fill="#ecf2ff" font-size="12">{card.club}</text>
</svg>

<style>
  .card {
    width: 100%;
    cursor: pointer;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.32));
  }
  .mini { max-width: 180px; }
  .micro { max-width: 130px; }
</style>

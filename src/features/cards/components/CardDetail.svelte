<script lang="ts">
  import type { Card } from '../../../core/types/card.types'
  import { formatCoins } from '../card.utils'
  export let card: Card
</script>

<h3>{card.name}</h3>
<p>OVR {card.baseOverall} - {card.position} - {card.rarity}</p>
<div class="bars">
  <div>PAC <progress max="99" value={card.pace}></progress> {card.pace}</div>
  <div>SHO <progress max="99" value={card.shooting}></progress> {card.shooting}</div>
  <div>PAS <progress max="99" value={card.passing}></progress> {card.passing}</div>
  <div>DRI <progress max="99" value={card.dribbling}></progress> {card.dribbling}</div>
  <div>DEF <progress max="99" value={card.defense}></progress> {card.defense}</div>
</div>
<p>Market Value: 🪙 {formatCoins(card.currentPrice)}</p>

<style>
  .bars { display: grid; gap: 0.35rem; }
  progress { width: 70%; }
</style>

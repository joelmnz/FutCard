import { describe, it, expect } from 'bun:test'
import { openPack, weightedRarity } from './pack.service'
import { gameState } from '../../core/state/game.state.svelte'
import type { PlayerTemplate } from '../../core/types/card.types'

const templates: PlayerTemplate[] = [{
  id: 'p',
  name: 'P',
  club: 'C',
  nation: '🇫🇷',
  league: 'L',
  position: 'CM',
  pace: 75,
  shooting: 75,
  passing: 75,
  dribbling: 75,
  defense: 75,
  baseOverall: 75
}]

describe('pack.service', () => {
  it('weightedRarity distribution includes expected options', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 1000; i += 1) seen.add(weightedRarity('gold'))
    expect(seen.has('rare')).toBe(true)
    expect(seen.has('epic')).toBe(true)
  })

  it('pack deducts correct coin amount', () => {
    gameState.coins = 20_000
    openPack('silver', templates)
    expect(gameState.coins).toBe(5_000)
  })

  it('returns correct card count per pack type', () => {
    gameState.coins = 200_000
    expect(openPack('bronze', templates).length).toBe(5)
    gameState.coins = 200_000
    expect(openPack('elite', templates).length).toBe(10)
  })
})

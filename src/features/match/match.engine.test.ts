import { describe, it, expect } from 'bun:test'
import { calculateChemistry, simulateMatch } from './match.engine'
import type { Card } from '../../core/types/card.types'

const card: Card = {
  id: '1',
  cardId: '1',
  name: 'Test',
  club: 'Club',
  nation: '🇪🇸',
  league: 'PL',
  position: 'ST',
  pace: 80,
  shooting: 80,
  passing: 80,
  dribbling: 80,
  defense: 60,
  baseOverall: 80,
  rarity: 'rare',
  xp: 0,
  upgradeCount: 0,
  priceHistory: [],
  currentPrice: 10_000,
  createdAt: Date.now()
}

describe('match.engine', () => {
  it('simulateMatch returns Promise<MatchResult>', async () => {
    const result = simulateMatch([card], { id: 'b', name: 'Bot', emoji: '🤖', style: 'fair', cards: [card] })
    expect(result).toBeInstanceOf(Promise)
    const resolved = await result
    expect(resolved.homeScore).toBeGreaterThanOrEqual(0)
  })

  it('events array is non-empty', async () => {
    const resolved = await simulateMatch([card], { id: 'b', name: 'Bot', emoji: '🤖', style: 'fair', cards: [card] })
    expect(resolved.events.length).toBeGreaterThan(0)
  })

  it('chemistry score clamps 0-100', () => {
    expect(calculateChemistry([card, card])).toBeLessThanOrEqual(100)
    expect(calculateChemistry([])).toBeGreaterThanOrEqual(0)
  })
})

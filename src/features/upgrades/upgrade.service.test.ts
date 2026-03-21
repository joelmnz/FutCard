import { describe, it, expect } from 'bun:test'
import { applyRarityPromotion, applyStatBoost } from './upgrade.service'
import type { Card } from '../../core/types/card.types'

const card: Card = {
  id: '1', cardId: '1', name: 'A', club: 'C', nation: '🇫🇷', league: 'PL', position: 'CM',
  pace: 98, shooting: 90, passing: 90, dribbling: 90, defense: 90, baseOverall: 90,
  rarity: 'common', xp: 6000, upgradeCount: 0, priceHistory: [], currentPrice: 1000, createdAt: Date.now()
}

describe('upgrade.service', () => {
  it('stat boost increments chosen stat by 1', async () => {
    const out = await applyStatBoost({ ...card, pace: 80, xp: 1000 }, 'pace', false)
    expect(out.pace).toBe(81)
  })

  it('stat boost cannot exceed 99', async () => {
    const out = await applyStatBoost(card, 'pace', false)
    expect(out.pace).toBe(99)
  })

  it('cannot upgrade beyond 10 total', async () => {
    const out = await applyRarityPromotion({ ...card, upgradeCount: 10 }, false)
    expect(out.upgradeCount).toBe(10)
  })
})

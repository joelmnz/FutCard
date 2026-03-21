import { describe, it, expect } from 'bun:test'
import { applyPriceTick } from './market.engine'
import type { MarketListing } from '../../core/types/market.types'

const listing: MarketListing = {
  listingId: '1',
  listPrice: 10_000,
  listedAt: Date.now(),
  isPlayerListed: false,
  card: {
    id: 'x',
    cardId: 'x',
    name: 'A',
    club: 'B',
    nation: '🇧🇪',
    league: 'PL',
    position: 'ST',
    pace: 80,
    shooting: 80,
    passing: 80,
    dribbling: 80,
    defense: 70,
    baseOverall: 80,
    rarity: 'rare',
    xp: 0,
    upgradeCount: 0,
    priceHistory: Array.from({ length: 29 }).map(() => 10_000),
    currentPrice: 10_000,
    createdAt: Date.now()
  }
}

describe('market.engine', () => {
  it('price fluctuation stays within ±8%', () => {
    const out = applyPriceTick([listing], () => 1)[0]
    expect(out.card.currentPrice).toBeLessThanOrEqual(10_800)
  })

  it('priceHistory never exceeds 30 entries', () => {
    const out = applyPriceTick([listing], () => 1)[0]
    expect(out.card.priceHistory.length).toBeLessThanOrEqual(30)
  })
})

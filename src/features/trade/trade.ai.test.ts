import { describe, it, expect } from 'bun:test'
import { evaluateTrade } from './trade.ai'
import type { Card } from '../../core/types/card.types'
import type { Bot } from '../../core/types/trade.types'

const rare: Card = {
  id: '1', cardId: '1', name: 'A', club: 'C', nation: '🇫🇷', league: 'PL', position: 'CM',
  pace: 75, shooting: 75, passing: 75, dribbling: 75, defense: 75, baseOverall: 75,
  rarity: 'rare', xp: 0, upgradeCount: 0, priceHistory: [], currentPrice: 1000, createdAt: Date.now()
}
const common = { ...rare, cardId: '2', rarity: 'common' as const, currentPrice: 300 }
const eliteBot: Bot = { id: 'e', name: 'EliteBot', emoji: '👑', style: 'elite', cards: [rare] }

describe('trade.ai', () => {
  it('generous bot accepts fair trade', () => {
    const bot: Bot = { id: 'd', name: 'DealBot', emoji: '🤝', style: 'generous', cards: [rare] }
    expect(evaluateTrade({ yourCards: [rare], botCards: [rare], coinTopUp: 0 }, bot).accepted).toBe(true)
  })

  it('greedy bot rejects undervalue offer', () => {
    const bot: Bot = { id: 'g', name: 'Greedy', emoji: '💰', style: 'greedy', cards: [rare] }
    expect(evaluateTrade({ yourCards: [common], botCards: [rare], coinTopUp: 0 }, bot).accepted).toBe(false)
  })

  it('elite bot rejects common card offers', () => {
    expect(evaluateTrade({ yourCards: [common], botCards: [rare], coinTopUp: 0 }, eliteBot).accepted).toBe(false)
  })
})

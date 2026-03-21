import type { Card } from './card.types'

export interface Bot {
  id: string
  name: string
  emoji: string
  style: 'fair' | 'greedy' | 'generous' | 'elite'
  cards: Card[]
}

export interface TradeOffer {
  yourCards: Card[]
  botCards: Card[]
  coinTopUp: number
}

export interface TradeResult {
  accepted: boolean
  reason: string
}

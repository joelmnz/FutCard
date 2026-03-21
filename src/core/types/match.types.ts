import type { Card, Position } from './card.types'

export interface Formation {
  name: '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '5-3-2'
  positions: Position[]
}

export interface MatchEvent {
  minute: number
  type: 'goal' | 'save' | 'miss' | 'tackle' | 'card' | 'foul'
  description: string
  score: string
}

export interface MatchResult {
  homeScore: number
  awayScore: number
  events: MatchEvent[]
  rewards: { coins: number; xpPerCard: number }
  motm: Card | null
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export type Position =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LW'
  | 'RW'
  | 'ST'
  | 'CF'

export interface PlayerTemplate {
  id: string
  name: string
  club: string
  nation: string
  league: string
  position: Position
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defense: number
  baseOverall: number
}

export interface Card extends PlayerTemplate {
  cardId: string
  rarity: Rarity
  xp: number
  upgradeCount: number
  priceHistory: number[]
  currentPrice: number
  createdAt: number
}

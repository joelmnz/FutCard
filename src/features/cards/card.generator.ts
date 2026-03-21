import type { Card, PlayerTemplate, Rarity } from '../../core/types/card.types'
import { calcOverall } from './card.utils'

const varianceByRarity: Record<Rarity, number> = {
  common: 5,
  rare: 4,
  epic: 3,
  legendary: 2
}

const rarityMultiplier: Record<Rarity, number> = {
  common: 10,
  rare: 50,
  epic: 200,
  legendary: 800
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function uuid() {
  return crypto.randomUUID()
}

export function generateCard(template: PlayerTemplate, rarity: Rarity): Card {
  const variance = varianceByRarity[rarity]

  const pace = Math.min(99, Math.max(1, template.pace + randInt(-variance, variance)))
  const shooting = Math.min(99, Math.max(1, template.shooting + randInt(-variance, variance)))
  const passing = Math.min(99, Math.max(1, template.passing + randInt(-variance, variance)))
  const dribbling = Math.min(99, Math.max(1, template.dribbling + randInt(-variance, variance)))
  const defense = Math.min(99, Math.max(1, template.defense + randInt(-variance, variance)))

  const overall = calcOverall({ pace, shooting, passing, dribbling, defense })
  const currentPrice = overall * overall * rarityMultiplier[rarity]

  return {
    ...template,
    pace,
    shooting,
    passing,
    dribbling,
    defense,
    baseOverall: overall,
    cardId: uuid(),
    rarity,
    xp: 0,
    upgradeCount: 0,
    priceHistory: [],
    currentPrice,
    createdAt: Date.now()
  }
}

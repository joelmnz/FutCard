import type { PlayerTemplate, Rarity } from '../../core/types/card.types'
import { gameState, spendCoins } from '../../core/state/game.state.svelte'
import { generateCard } from '../cards/card.generator'

export type PackType = 'bronze' | 'silver' | 'gold' | 'elite'

const packConfig: Record<PackType, { cost: number; count: number; weights: Array<{ rarity: Rarity; weight: number }> }> = {
  bronze: {
    cost: 5_000,
    count: 5,
    weights: [
      { rarity: 'common', weight: 75 },
      { rarity: 'rare', weight: 20 },
      { rarity: 'epic', weight: 5 }
    ]
  },
  silver: {
    cost: 15_000,
    count: 7,
    weights: [
      { rarity: 'common', weight: 35 },
      { rarity: 'rare', weight: 50 },
      { rarity: 'epic', weight: 15 }
    ]
  },
  gold: {
    cost: 35_000,
    count: 8,
    weights: [
      { rarity: 'common', weight: 10 },
      { rarity: 'rare', weight: 50 },
      { rarity: 'epic', weight: 30 },
      { rarity: 'legendary', weight: 10 }
    ]
  },
  elite: {
    cost: 100_000,
    count: 10,
    weights: [
      { rarity: 'rare', weight: 15 },
      { rarity: 'epic', weight: 50 },
      { rarity: 'legendary', weight: 35 }
    ]
  }
}

export function weightedRarity(type: PackType, random = Math.random): Rarity {
  const roll = random() * 100
  let cursor = 0
  for (const option of packConfig[type].weights) {
    cursor += option.weight
    if (roll <= cursor) return option.rarity
  }
  return packConfig[type].weights.at(-1)?.rarity ?? 'common'
}

export function openPack(type: PackType, templates: PlayerTemplate[], random = Math.random) {
  const config = packConfig[type]
  if (gameState.coins < config.cost) throw new Error('Not enough coins')
  spendCoins(config.cost)

  return Array.from({ length: config.count }).map(() => {
    const template = templates[Math.floor(random() * templates.length)]
    return generateCard(template, weightedRarity(type, random))
  })
}

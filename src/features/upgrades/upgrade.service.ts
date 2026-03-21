import type { Card, Rarity } from '../../core/types/card.types'
import { updateCard } from '../../core/state/collection.state.svelte'
import { dbPut } from '../../core/db/db.helpers'

const rarityOrder: Rarity[] = ['common', 'rare', 'epic', 'legendary']

export function canUpgrade(card: Card) {
  return card.upgradeCount < 10 && card.xp >= 500
}

export async function applyStatBoost(
  card: Card,
  stat: keyof Pick<Card, 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defense'>,
  persist = true
) {
  if (!canUpgrade(card)) return card
  const updated = { ...card, [stat]: Math.min(99, card[stat] + 1), xp: card.xp - 500, upgradeCount: card.upgradeCount + 1 }
  updateCard(updated)
  if (persist) await dbPut('collection', updated)
  return updated
}

export async function applyRarityPromotion(card: Card, persist = true) {
  if (card.upgradeCount >= 10 || card.xp < 5000) return card
  const idx = rarityOrder.indexOf(card.rarity)
  const rarity = rarityOrder[Math.min(idx + 1, rarityOrder.length - 1)]
  const updated = { ...card, rarity, xp: card.xp - 5000, upgradeCount: card.upgradeCount + 1 }
  updateCard(updated)
  if (persist) await dbPut('collection', updated)
  return updated
}

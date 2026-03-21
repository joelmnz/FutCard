import type { Position, Rarity } from '../../core/types/card.types'

export function calcOverall(stats: {
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defense: number
}) {
  const weighted =
    stats.pace * 0.2 +
    stats.shooting * 0.25 +
    stats.passing * 0.2 +
    stats.dribbling * 0.2 +
    stats.defense * 0.15
  return Math.round(weighted)
}

export function getRarityColour(rarity: Rarity) {
  if (rarity === 'legendary') return 'var(--accent-gold)'
  if (rarity === 'epic') return 'var(--accent-purple)'
  if (rarity === 'rare') return 'var(--accent-blue)'
  return '#8a94aa'
}

export function formatCoins(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${Math.round(n)}`
}

export function getPositionArchetype(position: Position) {
  if (position === 'GK') return 'goalkeeper'
  if (position === 'CB' || position === 'LB' || position === 'RB') return 'defender'
  if (position === 'CDM' || position === 'CM' || position === 'CAM') return 'midfielder'
  return 'attacker'
}

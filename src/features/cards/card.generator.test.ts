import { describe, it, expect } from 'bun:test'
import { generateCard } from './card.generator'
import type { PlayerTemplate } from '../../core/types/card.types'

const template: PlayerTemplate = {
  id: 't1',
  name: 'Test Player',
  club: 'Club',
  nation: '🏴',
  league: 'League',
  position: 'ST',
  pace: 80,
  shooting: 80,
  passing: 80,
  dribbling: 80,
  defense: 80,
  baseOverall: 80
}

describe('card.generator', () => {
  it('generateCard returns correct rarity', () => {
    const card = generateCard(template, 'epic')
    expect(card.rarity).toBe('epic')
  })

  it('stats within variance bounds', () => {
    const card = generateCard(template, 'rare')
    expect(Math.abs(card.pace - 80)).toBeLessThanOrEqual(4)
  })

  it('price formula produces positive value', () => {
    const card = generateCard(template, 'common')
    expect(card.currentPrice).toBeGreaterThan(0)
  })

  it('upgradeCount initializes to 0', () => {
    const card = generateCard(template, 'common')
    expect(card.upgradeCount).toBe(0)
  })
})

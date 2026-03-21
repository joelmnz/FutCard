import type { Bot } from '../../core/types/trade.types'
import type { Card } from '../../core/types/card.types'
import type { MatchEvent, MatchResult } from '../../core/types/match.types'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function calculateChemistry(team: Card[]) {
  if (!team.length) return 0
  let score = 50
  for (let i = 0; i < team.length - 1; i += 1) {
    if (team[i].club === team[i + 1].club) score += 15
    if (team[i].nation === team[i + 1].nation) score += 10
    if (team[i].league === team[i + 1].league) score += 5
  }
  return clamp(score, 0, 100)
}

export async function simulateMatch(yourTeam: Card[], opponentBot: Bot): Promise<MatchResult> {
  const events: MatchEvent[] = []
  let homeScore = 0
  let awayScore = 0

  const chemistry = calculateChemistry(yourTeam)
  const chemistryBonus = chemistry / 10
  const yourAvg = yourTeam.reduce((s, c) => s + c.baseOverall, 0) / Math.max(1, yourTeam.length)
  const oppAvg = opponentBot.cards.reduce((s, c) => s + c.baseOverall, 0) / Math.max(1, opponentBot.cards.length)

  for (let minute = 5; minute <= 90; minute += 5) {
    const attack = yourAvg + chemistryBonus + Math.random() * 10
    const defense = oppAvg + Math.random() * 10
    const eventChance = attack / (attack + defense)

    if (Math.random() < eventChance * 0.35) {
      homeScore += 1
      events.push({ minute, type: 'goal', description: `⚽ ${minute}' - FutCard scores!`, score: `${homeScore}-${awayScore}` })
    } else if (Math.random() < 0.2) {
      awayScore += 1
      events.push({ minute, type: 'goal', description: `⚽ ${minute}' - ${opponentBot.name} scores!`, score: `${homeScore}-${awayScore}` })
    } else {
      events.push({ minute, type: 'tackle', description: `🛡 ${minute}' - Midfield battle.`, score: `${homeScore}-${awayScore}` })
    }
  }

  const win = homeScore > awayScore
  const draw = homeScore === awayScore
  const multiplier = Math.max(0.7, oppAvg / 80)
  const rewards = {
    coins: Math.round((win ? oppAvg * 150 : draw ? oppAvg * 75 : oppAvg * 25) * multiplier),
    xpPerCard: win ? 50 : draw ? 20 : 10
  }

  return {
    homeScore,
    awayScore,
    events,
    rewards,
    motm: yourTeam.sort((a, b) => b.baseOverall - a.baseOverall)[0] ?? null
  }
}

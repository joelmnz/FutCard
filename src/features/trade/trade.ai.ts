import type { Bot, TradeOffer, TradeResult } from '../../core/types/trade.types'

function offerValue(offer: TradeOffer) {
  const your = offer.yourCards.reduce((sum, c) => sum + c.currentPrice, 0) + offer.coinTopUp
  const bot = offer.botCards.reduce((sum, c) => sum + c.currentPrice, 0)
  return { your, bot }
}

export function evaluateTrade(offer: TradeOffer, bot: Bot): TradeResult {
  const { your, bot: theirs } = offerValue(offer)
  if (theirs <= 0) return { accepted: false, reason: 'Invalid offer.' }

  const ratio = your / theirs
  const threshold = bot.style === 'greedy' ? 1.05 : bot.style === 'generous' ? 0.7 : bot.style === 'elite' ? 0.9 : 0.85

  if (bot.style === 'elite' && offer.yourCards.some((c) => c.rarity !== 'epic' && c.rarity !== 'legendary')) {
    return { accepted: false, reason: 'EliteBot only wants epic or legendary cards.' }
  }

  return ratio >= threshold
    ? { accepted: true, reason: `${bot.name} accepted the trade.` }
    : { accepted: false, reason: `${bot.name} rejected. Offer more value.` }
}

import type { MarketListing } from '../../core/types/market.types'
import { marketState } from '../../core/state/market.state.svelte'

export function applyPriceTick(listings: MarketListing[], random = Math.random) {
  return listings.map((listing) => {
    const delta = 1 + (random() * 0.16 - 0.08)
    const currentPrice = Math.max(100, Math.round(listing.card.currentPrice * delta))
    const priceHistory = [...listing.card.priceHistory, currentPrice].slice(-30)

    return {
      ...listing,
      listPrice: currentPrice,
      card: {
        ...listing.card,
        currentPrice,
        priceHistory
      }
    }
  })
}

export function startPriceFluctuation() {
  return setInterval(() => {
    marketState.listings = applyPriceTick(marketState.listings)
  }, 8_000)
}

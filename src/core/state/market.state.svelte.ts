import type { MarketListing } from '../types/market.types'

export const marketState = $state({ listings: [] as MarketListing[] })

export function setListings(listings: MarketListing[]) {
  marketState.listings = listings
}

export function upsertListing(listing: MarketListing) {
  const idx = marketState.listings.findIndex((l) => l.listingId === listing.listingId)
  if (idx === -1) {
    marketState.listings.push(listing)
    return
  }
  marketState.listings[idx] = listing
}

export function removeListing(id: string) {
  marketState.listings = marketState.listings.filter((listing) => listing.listingId !== id)
}

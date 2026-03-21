import type { Card } from './card.types'

export interface MarketListing {
  listingId: string
  card: Card
  listPrice: number
  listedAt: number
  isPlayerListed: boolean
}

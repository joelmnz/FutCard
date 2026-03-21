import type { Card } from '../types/card.types'

export const collectionState = $state({ cards: [] as Card[] })

export function setCards(cards: Card[]) {
  collectionState.cards = cards
}

export function addCard(card: Card) {
  collectionState.cards.push(card)
}

export function removeCard(id: string) {
  collectionState.cards = collectionState.cards.filter((card) => card.cardId !== id)
}

export function updateCard(updated: Card) {
  const idx = collectionState.cards.findIndex((card) => card.cardId === updated.cardId)
  if (idx !== -1) collectionState.cards[idx] = updated
}

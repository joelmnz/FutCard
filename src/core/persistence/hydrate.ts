import { dbGet, dbGetAll } from '../db/db.helpers'
import type { GameState } from '../types/game.types'
import type { Card, PlayerTemplate, Rarity } from '../types/card.types'
import type { MarketListing } from '../types/market.types'
import type { Bot } from '../types/trade.types'
import { addCard, setCards } from '../state/collection.state.svelte'
import { gameState } from '../state/game.state.svelte'
import { setListings } from '../state/market.state.svelte'
import { setBots } from '../state/trade.state.svelte'
import players from '../../data/players.json'
import { generateCard } from '../../features/cards/card.generator'

function starterRarity(index: number): Rarity {
  return index < 5 ? 'common' : 'rare'
}

export async function initNewGame() {
  gameState.coins = 1_000_000
  gameState.onboardingDone = false
  gameState.managerName = ''

  const seed = (players as PlayerTemplate[]).slice(0, 7)
  seed.forEach((template, i) => addCard(generateCard(template, starterRarity(i))))
}

export async function hydrate() {
  const savedGame = await dbGet<GameState>('gameState', 'singleton')
  const cards = await dbGetAll<Card>('collection')
  const listings = await dbGetAll<MarketListing>('market')
  const bots = await dbGetAll<Bot>('bots')

  if (!savedGame) {
    await initNewGame()
    return
  }

  Object.assign(gameState, savedGame)
  setCards(cards)
  setListings(listings)
  setBots(bots)

  if (!cards.length && !gameState.onboardingDone) {
    await initNewGame()
  }
}

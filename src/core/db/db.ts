import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Card } from '../types/card.types'
import type { GameState } from '../types/game.types'
import type { MarketListing } from '../types/market.types'
import type { Bot } from '../types/trade.types'

interface MatchRecord {
  matchId: string
  date: number
  result: 'win' | 'draw' | 'loss'
  payload: unknown
}

interface FutCardDB extends DBSchema {
  gameState: {
    key: string
    value: GameState
  }
  collection: {
    key: string
    value: Card
    indexes: {
      rarity: Card['rarity']
      overall: number
      position: Card['position']
    }
  }
  market: {
    key: string
    value: MarketListing
    indexes: {
      rarity: MarketListing['card']['rarity']
      listPrice: number
      position: MarketListing['card']['position']
    }
  }
  bots: {
    key: string
    value: Bot
  }
  matches: {
    key: string
    value: MatchRecord
    indexes: {
      date: number
      result: MatchRecord['result']
    }
  }
}

export type DbStoreName = 'gameState' | 'collection' | 'market' | 'bots' | 'matches'

let dbPromise: Promise<IDBPDatabase<FutCardDB>> | null = null

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FutCardDB>('futcard-db', 1, {
      upgrade(db) {
        const game = db.createObjectStore('gameState')
        game.put(
          {
            managerName: 'Manager',
            coins: 1_000_000,
            xpPool: 0,
            onboardingDone: false,
            lastSaved: Date.now()
          },
          'singleton'
        )

        const collection = db.createObjectStore('collection', { keyPath: 'cardId' })
        collection.createIndex('rarity', 'rarity')
        collection.createIndex('overall', 'baseOverall')
        collection.createIndex('position', 'position')

        const market = db.createObjectStore('market', { keyPath: 'listingId' })
        market.createIndex('rarity', 'card.rarity')
        market.createIndex('listPrice', 'listPrice')
        market.createIndex('position', 'card.position')

        db.createObjectStore('bots', { keyPath: 'id' })

        const matches = db.createObjectStore('matches', { keyPath: 'matchId' })
        matches.createIndex('date', 'date')
        matches.createIndex('result', 'result')
      }
    })
  }
  return dbPromise
}

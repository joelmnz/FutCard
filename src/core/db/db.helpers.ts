import { getDB, type DbStoreName } from './db'
import type { Card } from '../types/card.types'
import type { GameState } from '../types/game.types'
import type { MarketListing } from '../types/market.types'
import type { Bot } from '../types/trade.types'

type DbValue =
  | Card
  | GameState
  | MarketListing
  | Bot
  | { matchId: string; date: number; result: 'win' | 'draw' | 'loss'; payload: unknown }

export async function dbGet<T = unknown>(store: DbStoreName, key: string) {
  try {
    const db = await getDB()
    return (await db.get(store, key)) as T | undefined
  } catch (error) {
    console.error('[dbGet]', error)
    return undefined
  }
}

export async function dbSet(store: DbStoreName, key: string, value: DbValue) {
  try {
    const db = await getDB()
    await db.put(store, value, key)
  } catch (error) {
    console.error('[dbSet]', error)
  }
}

export async function dbPut(store: DbStoreName, value: DbValue) {
  try {
    const db = await getDB()
    await db.put(store, value)
  } catch (error) {
    console.error('[dbPut]', error)
  }
}

export async function dbDelete(store: DbStoreName, key: string) {
  try {
    const db = await getDB()
    await db.delete(store, key)
  } catch (error) {
    console.error('[dbDelete]', error)
  }
}

export async function dbGetAll<T = unknown>(store: DbStoreName) {
  try {
    const db = await getDB()
    return (await db.getAll(store)) as T[]
  } catch (error) {
    console.error('[dbGetAll]', error)
    return []
  }
}

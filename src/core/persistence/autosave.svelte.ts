import { getDB } from '../db/db'
import { collectionState } from '../state/collection.state.svelte'
import { gameState } from '../state/game.state.svelte'
import { marketState } from '../state/market.state.svelte'
import { tradeState } from '../state/trade.state.svelte'

let saveTimer: ReturnType<typeof setTimeout> | null = null

function queueSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      gameState.lastSaved = Date.now()
      const db = await getDB()
      const tx = db.transaction(['gameState', 'collection', 'market', 'bots'], 'readwrite')

      await tx.objectStore('gameState').put($state.snapshot(gameState), 'singleton')

      const collectionStore = tx.objectStore('collection')
      await collectionStore.clear()
      for (const card of $state.snapshot(collectionState.cards)) await collectionStore.put(card)

      const marketStore = tx.objectStore('market')
      await marketStore.clear()
      for (const listing of $state.snapshot(marketState.listings)) await marketStore.put(listing)

      const botStore = tx.objectStore('bots')
      await botStore.clear()
      for (const bot of $state.snapshot(tradeState.bots)) await botStore.put(bot)

      await tx.done
    } catch (error) {
      console.error('[autosave] persistence failed', error)
    }
  }, 500)
}

export function setupAutosave() {
  $effect(() => {
    gameState.coins
    gameState.managerName
    gameState.onboardingDone

    // Track content changes as well as list size changes so autosave catches
    // market ticks, upgrades, and other in-place mutations.
    JSON.stringify(collectionState.cards)
    JSON.stringify(marketState.listings)
    JSON.stringify(tradeState.bots)

    queueSave()
  })
}

import type { GameState } from '../types/game.types'

export const gameState = $state<GameState>({
  managerName: '',
  coins: 1_000_000,
  xpPool: 0,
  onboardingDone: false,
  lastSaved: Date.now()
})

export function setManagerName(managerName: string) {
  gameState.managerName = managerName
}

export function addCoins(coins: number) {
  gameState.coins += coins
}

export function spendCoins(coins: number) {
  gameState.coins = Math.max(0, gameState.coins - coins)
}

export function markOnboardingDone() {
  gameState.onboardingDone = true
}

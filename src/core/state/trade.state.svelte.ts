import type { Bot, TradeOffer } from '../types/trade.types'

export const tradeState = $state({
  bots: [] as Bot[],
  yourOffer: { yourCards: [], botCards: [], coinTopUp: 0 } as TradeOffer,
  botOffer: { yourCards: [], botCards: [], coinTopUp: 0 } as TradeOffer,
  selectedBotId: ''
})

export function setBots(bots: Bot[]) {
  tradeState.bots = bots
}

export function setSelectedBotId(botId: string) {
  tradeState.selectedBotId = botId
}

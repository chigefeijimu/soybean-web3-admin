import { request } from '@/service/request'

export interface YieldPosition {
  id: string
  protocol: string
  chain: string
  type: 'staking' | 'lending' | 'liquidity' | 'farming' | 'bridge'
  token0: string
  token1?: string
  value: number
  valueUsd: number
  yield: number
  yieldUsd: number
  apy: number
  lastUpdated: string
}

export interface ChainYield {
  chain: string
  chainName: string
  totalValue: number
  totalYield: number
  positions: number
  apy: number
}

export interface ProtocolYield {
  protocol: string
  protocolName: string
  totalValue: number
  totalYield: number
  positions: number
  chains: string[]
  apy: number
}

export interface YieldAnalytics {
  totalValue: number
  totalYield: number
  totalYieldPercent: number
  bestPerformer: {
    protocol: string
    apy: number
  }
  chains: ChainYield[]
  protocols: ProtocolYield[]
  positions: YieldPosition[]
  yieldHistory: {
    date: string
    yield: number
  }[]
}

export interface YieldTypeComparison {
  staking: { value: number; yield: number; apy: number }
  lending: { value: number; yield: number; apy: number }
  liquidity: { value: number; yield: number; apy: number }
  farming: { value: number; yield: number; apy: number }
}

export const yieldAnalyticsApi = {
  // Get comprehensive yield analytics
  getYieldAnalytics(wallet?: string) {
    return request.get<YieldAnalytics>('/yield-analytics', { 
      params: wallet ? { wallet } : {} 
    })
  },

  // Get yield breakdown by chain
  getChainYieldSummary() {
    return request.get<{ chains: ChainYield[]; totalValue: number; totalYield: number }>('/yield-analytics/chains')
  },

  // Get yield breakdown by protocol
  getProtocolYieldSummary() {
    return request.get<{ protocols: ProtocolYield[]; totalValue: number; totalYield: number }>('/yield-analytics/protocols')
  },

  // Get yield history
  getYieldHistory(days: number = 30) {
    return request.get<{ history: { date: string; yield: number }[]; totalYield: number; averageDailyYield: number }>('/yield-analytics/history', {
      params: { days }
    })
  },

  // Get yield comparison by type (staking/lending/liquidity/farming)
  getYieldByType() {
    return request.get<YieldTypeComparison>('/yield-analytics/types')
  },

  // Get all yield positions
  getYieldPositions() {
    return request.get<YieldPosition[]>('/yield-analytics/positions')
  }
}

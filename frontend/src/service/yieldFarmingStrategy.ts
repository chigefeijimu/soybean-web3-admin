import { request } from '@/service/request'

export interface StrategyParams {
  capital: number
  riskTolerance: 'low' | 'medium' | 'high'
  preferredChains?: string[]
  preferredProtocols?: string[]
  investmentGoal: 'stable' | 'balanced' | 'aggressive'
  timeframe: 'short' | 'medium' | 'long'
}

export interface Allocation {
  protocol: string
  chain: string
  pool: string
  percentage: number
  amount: number
  apy: number
}

export interface Strategy {
  id: string
  name: string
  description: string
  totalApy: number
  riskScore: number
  allocations: Allocation[]
  expectedReturn: number
  recommendation: string
}

export interface ChainOverview {
  chain: string
  avgApy: number
  totalTvl: number
  poolCount: number
  topPool: {
    protocol: string
    pool: string
    apy: number
  }
}

export interface TopStrategy {
  id: string
  name: string
  description: string
  apy: number
  risk: 'low' | 'medium' | 'high'
  chains: string[]
}

export interface Protocol {
  name: string
  chains: string[]
  avgApy: number
  totalTvl: number
  category: string
}

export const yieldFarmingStrategyApi = {
  // Generate a yield farming strategy based on user preferences
  generateStrategy(params: StrategyParams) {
    return request.post<Strategy>('/yield-farming-strategy/generate', params)
  },

  // Get market overview by chain
  getMarketOverview() {
    return request.get<{
      timestamp: string
      chains: ChainOverview[]
      marketTrend: 'bullish' | 'bearish' | 'neutral'
      totalPools: number
    }>('/yield-farming-strategy/market-overview')
  },

  // Get top pre-defined strategies
  getTopStrategies() {
    return request.get<TopStrategy[]>('/yield-farming-strategy/top-strategies')
  },

  // Get supported protocols
  getProtocols() {
    return request.get<Protocol[]>('/yield-farming-strategy/protocols')
  }
}

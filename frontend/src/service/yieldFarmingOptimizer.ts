import { request } from '@/service/request'

export interface YieldPool {
  id: string
  protocol: string
  chain: string
  pair: string
  token0: string
  token1: string
  tvl: number
  volume24h: number
  apy: number
  apr: number
  rewardToken: string
  rewardTokenPrice: number
  risk: 'low' | 'medium' | 'high'
  poolAddress: string
  farmType: 'single' | 'double' | 'triple'
  lockPeriod: number
  impermanentLoss: number
  lastUpdated: number
}

export interface OptimizationRequest {
  principal: number
  duration: number
  riskTolerance: 'low' | 'medium' | 'high'
  preferredChains?: string[]
  preferredProtocols?: string[]
  tokenPreference?: string
}

export interface StrategyAllocation {
  protocol: string
  chain: string
  pool: string
  allocation: number
  expectedReturn: number
  risk: number
  reasons: string[]
}

export interface OptimizationResult {
  strategies: StrategyAllocation[]
  totalExpectedReturn: number
  totalRisk: number
  recommendation: string
}

export interface PoolFilters {
  chain?: string
  protocol?: string
  minTvl?: number
  minApy?: number
  risk?: string
}

export interface MarketOverview {
  totalTvl: number
  totalVolume24h: number
  averageApy: number
  topChains: { chain: string; tvl: number; pools: number }[]
  topProtocols: { protocol: string; tvl: number; pools: number }[]
}

export const yieldFarmingOptimizerApi = {
  // Get all pools with optional filters
  getPools(filters?: PoolFilters) {
    return request.get<YieldPool[]>('/yield-farming-optimizer/pools', { params: filters })
  },

  // Get pool details by ID
  getPoolDetails(poolId: string) {
    return request.get<YieldPool>(`/yield-farming-optimizer/pools/${poolId}`)
  },

  // Get top pools
  getTopPools(limit = 10, chain?: string) {
    return request.get<YieldPool[]>('/yield-farming-optimizer/top-pools', {
      params: { limit, chain }
    })
  },

  // Optimize yield based on user preferences
  optimizeYield(request: OptimizationRequest) {
    return request.post<OptimizationResult>('/yield-farming-optimizer/optimize', request)
  },

  // Get historical data for a pool
  getHistoricalData(poolId: string, days = 30) {
    return request.get(`/yield-farming-optimizer/historical/${poolId}`, {
      params: { days }
    })
  },

  // Calculate compound growth
  calculateCompoundGrowth(principal: number, apy: number, frequency: 'daily' | 'weekly' | 'monthly', days: number) {
    return request.post('/yield-farming-optimizer/compound', {
      principal,
      apy,
      frequency,
      days
    })
  },

  // Compare multiple pools
  comparePools(poolIds: string[]) {
    return request.post('/yield-farming-optimizer/compare', { poolIds })
  },

  // Get market overview
  getMarketOverview() {
    return request.get<MarketOverview>('/yield-farming-optimizer/overview')
  }
}

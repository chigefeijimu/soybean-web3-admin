import { request } from '@/service/request'

export interface Chain {
  id: string
  name: string
  symbol: string
  chainId: number
}

export interface Bridge {
  id: string
  name: string
  type: string
  fee: number
  avgTime: string
  security: number
}

export interface RouteStep {
  step: number
  action: string
  description: string
  fromChain?: string
  toChain?: string
  chain?: string
  fromToken?: string
  toToken?: string
  bridge?: string
  protocol?: string
  estimatedTime: string
}

export interface RouteOption {
  bridge: string
  bridgeId: string
  path: string[]
  inputAmount: number
  outputAmount: number
  fees: {
    bridgeFee: number
    estimatedGas: number
  }
  estimatedTime: string
  securityScore: number
  steps: RouteStep[]
}

export interface Quote {
  bridge: string
  bridgeId: string
  inputAmount: string
  outputAmount: string
  outputAmountUSD: string
  bridgeFee: string
  bridgeFeeUSD: string
  estimatedTime: string
  securityScore: number
  gasEstimate: string
  totalCost: string
  route: string[]
}

export interface LiquidityPool {
  id: string
  bridge: string
  chain: string
  token: string
  liquidity: string
  liquidityUSD: string
  volume24h: string
  apy: string
  tvl: string
  utilization: string
}

export interface CompareRoute {
  type: string
  name: string
  bridge: string
  outputAmount: number
  outputAmountUSD: number
  totalFees: number
  estimatedTime: string
  hops: number
  middleChain?: string
}

export const liquidityRouterApi = {
  // Get supported chains
  getSupportedChains() {
    return request.get<{ success: boolean; chains: Chain[]; count: number }>('/cross-chain-liquidity-router/supported-chains')
  },

  // Get supported bridges
  getSupportedBridges() {
    return request.get<{ success: boolean; bridges: Bridge[]; count: number }>('/cross-chain-liquidity-router/supported-bridges')
  },

  // Get popular routes
  getPopularRoutes() {
    return request.get<{
      success: boolean
      routes: Array<{ from: string; to: string; fromToken: string; toToken: string; volume24h: string }>
      count: number
    }>('/cross-chain-liquidity-router/popular-routes')
  },

  // Find optimal route
  findRoute(params: {
    fromChain: string
    toChain: string
    fromToken: string
    toToken: string
    amount: string
    slippage?: string
  }) {
    return request.post<{
      success: boolean
      fromChain: string
      toChain: string
      fromToken: string
      toToken: string
      amount: string
      inputAmount: string
      outputAmount: string
      outputAmountUSD: string
      route: RouteOption
      alternatives: Array<{
        rank: number
        outputAmount: string
        outputAmountUSD: string
        route: RouteOption
      }>
      timestamp: string
    }>('/cross-chain-liquidity-router/find-route', params)
  },

  // Get quotes from multiple bridges
  getQuotes(params: {
    fromChain: string
    toChain: string
    fromToken: string
    toToken: string
    amount: string
  }) {
    return request.post<{
      success: boolean
      fromChain: string
      toChain: string
      fromToken: string
      toToken: string
      amount: string
      quotes: Quote[]
      bestQuote: Quote
      timestamp: string
    }>('/cross-chain-liquidity-router/get-quotes', params)
  },

  // Get liquidity pools
  getLiquidity(params: { chain: string; token: string }) {
    return request.post<{
      success: boolean
      chain: string
      token: string
      pools: LiquidityPool[]
      totalLiquidity: string
      totalVolume24h: string
      poolCount: number
      timestamp: string
    }>('/cross-chain-liquidity-router/get-liquidity', params)
  },

  // Compare routes
  compareRoutes(params: {
    fromChain: string
    toChain: string
    fromToken: string
    toToken: string
    amount: string
  }) {
    return request.post<{
      success: boolean
      fromChain: string
      toChain: string
      fromToken: string
      toToken: string
      amount: string
      routes: CompareRoute[]
      recommendation: CompareRoute
      timestamp: string
    }>('/cross-chain-liquidity-router/compare-routes', params)
  }
}

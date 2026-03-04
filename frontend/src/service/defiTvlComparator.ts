import { request } from '../request';

export interface ProtocolTVL {
  id: string;
  name: string;
  category: 'dex' | 'lending' | 'staking' | 'bridge' | 'derivatives' | 'yield' | 'nft';
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  tvlChange30d: number;
  rank: number;
  logoUrl?: string;
}

export interface ChainTVL {
  chain: string;
  tvl: number;
  tvlChange24h: number;
  changePercent: number;
  dominantProtocol: string;
}

export interface TVLHistory {
  date: string;
  tvl: number;
}

export interface TVLComparison {
  protocols: ProtocolTVL[];
  chains: ChainTVL[];
  totalTVL: number;
  totalTVLChange24h: number;
  historicalTrend: TVLHistory[];
}

export interface ProtocolDetails {
  id: string;
  name: string;
  category: string;
  chains: string[];
  chainBreakdown: {
    chain: string;
    tvl: number;
    tvlShare: number;
    rank: number;
  }[];
  totalTVL: number;
  tvlChange24h: number;
  tvlChange7d: number;
  tvlChange30d: number;
  historicalTrend: TVLHistory[];
  topHolderPercent: number;
  avgGasCost: number;
}

export interface TVLTrendAnalysis {
  protocolId: string;
  trend: 'growing' | 'stable' | 'declining';
  changePercent: number;
  volatility: number;
  prediction: {
    next7d: number;
    next30d: number;
    confidence: number;
  };
}

export interface CategoryBreakdown {
  category: string;
  name: string;
  totalTVL: number;
  protocolCount: number;
  sharePercent: number;
  topProtocol: string;
}

/**
 * Get TVL comparison across protocols and chains
 */
export function getTVLComparison(params: {
  chains?: string[];
  categories?: string[];
  timeRange?: string;
}) {
  return request<{ success: boolean; data: TVLComparison }>({
    url: '/defi-tvl-comparator/comparison',
    method: 'get',
    params: {
      chains: params.chains?.join(','),
      categories: params.categories?.join(','),
      timeRange: params.timeRange
    }
  });
}

/**
 * Get detailed information about a specific protocol
 */
export function getProtocolDetails(protocolId: string) {
  return request<{ success: boolean; data: ProtocolDetails }>({
    url: `/defi-tvl-comparator/protocol/${protocolId}`,
    method: 'get'
  });
}

/**
 * Get TVL trends for multiple protocols
 */
export function getTVLTrends(protocolIds: string[], timeRange?: string) {
  return request<{ success: boolean; data: TVLTrendAnalysis[] }>({
    url: '/defi-tvl-comparator/trends',
    method: 'get',
    params: {
      protocolIds: protocolIds.join(','),
      timeRange
    }
  });
}

/**
 * Get top gaining protocols by TVL change
 */
export function getTopGainers(limit?: number, period?: string) {
  return request<{ success: boolean; data: ProtocolTVL[] }>({
    url: '/defi-tvl-comparator/gainers',
    method: 'get',
    params: { limit, period }
  });
}

/**
 * Get breakdown by category
 */
export function getCategoryBreakdown() {
  return request<{ success: boolean; data: CategoryBreakdown[] }>({
    url: '/defi-tvl-comparator/categories',
    method: 'get'
  });
}

/**
 * Get supported chains
 */
export function getSupportedChains() {
  return request<{ success: boolean; data: { id: string; name: string }[] }>({
    url: '/defi-tvl-comparator/chains',
    method: 'get'
  });
}

/**
 * Get supported categories
 */
export function getSupportedCategories() {
  return request<{ success: boolean; data: string[] }>({
    url: '/defi-tvl-comparator/categories/list',
    method: 'get'
  });
}

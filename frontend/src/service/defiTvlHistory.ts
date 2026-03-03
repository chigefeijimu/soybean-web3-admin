import { request } from '@/service/request';

export interface TvlPoint {
  date: string;
  tvl: number;
}

export interface TvlStatistics {
  average: number;
  min: number;
  max: number;
  change24h: number;
  volatility: number;
}

export interface ProtocolTvlHistory {
  protocol: string;
  chain: string;
  currentTvl: number;
  history: TvlPoint[];
  statistics: TvlStatistics;
}

export interface TvlTrend {
  protocol: string;
  chain: string;
  currentTvl: number;
  trend7d: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export interface ChainDistribution {
  chain: string;
  tvl: number;
  share: number;
}

export interface TopProtocol {
  name: string;
  tvl: number;
  share: number;
}

export interface TvlStatisticsData {
  totalTvl: number;
  protocolCount: number;
  chainDistribution: ChainDistribution[];
  topProtocols: TopProtocol[];
  lastUpdated: string;
}

export const defiTvlHistoryApi = {
  getProtocolTvlHistory: (protocol: string, params?: { chain?: string; timeframe?: string }) =>
    request.get(`/defi-tvl-history/protocol/${protocol}`, { params }),
  
  getTvlTrends: () =>
    request.get<TvlTrend[]>('/defi-tvl-history/trends'),
  
  getTvlStatistics: (chain?: string) =>
    request.get<TvlStatisticsData>('/defi-tvl-history/statistics', { 
      params: { chain } 
    }),
  
  getChainTvlHistory: (chain: string, timeframe?: string) =>
    request.get(`/defi-tvl-history/chain/${chain}`, { 
      params: { timeframe } 
    }),
  
  searchProtocols: (query: string) =>
    request.get('/defi-tvl-history/search', { 
      params: { q: query } 
    }),
};

import { request } from './request';

export interface DexTrade {
  hash: string;
  chain: string;
  dex: string;
  timestamp: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromValue: number;
  toValue: number;
  gasFee: number;
  priceImpact: number;
  status: 'success' | 'failed' | 'pending';
}

export interface TradingStats {
  totalVolume: number;
  totalTrades: number;
  totalFees: number;
  averageTradeSize: number;
  profitableTrades: number;
  losingTrades: number;
  winRate: number;
  bestTrade: DexTrade | null;
  worstTrade: DexTrade | null;
  mostUsedDex: string;
  mostTradedPair: string;
  chainDistribution: Record<string, number>;
  dexDistribution: Record<string, number>;
  dailyVolume: { date: string; volume: number }[];
  tradeCountByDay: { date: string; count: number }[];
}

export const dexTradingJournal = {
  // Get DEX trades for an address
  getTrades: (address: string, chain?: string, dex?: string) => {
    const params = new URLSearchParams({ address });
    if (chain) params.append('chain', chain);
    if (dex) params.append('dex', dex);
    return request.get(`/dex-trading-journal/trades?${params.toString()}`);
  },

  // Get trading statistics
  getStats: (address: string, chain?: string, dex?: string) => {
    const params = new URLSearchParams({ address });
    if (chain) params.append('chain', chain);
    if (dex) params.append('dex', dex);
    return request.get(`/dex-trading-journal/stats?${params.toString()}`);
  },

  // Get top traders
  getTopTraders: (chain?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (chain) params.append('chain', chain);
    if (limit) params.append('limit', limit.toString());
    return request.get(`/dex-trading-journal/top-traders?${params.toString()}`);
  },

  // Get DEX performance
  getDexPerformance: (chain?: string) => {
    const params = new URLSearchParams();
    if (chain) params.append('chain', chain);
    return request.get(`/dex-trading-journal/dex-performance?${params.toString()}`);
  },

  // Get trending pairs
  getTrendingPairs: (chain: string = 'ethereum') => {
    return request.get(`/dex-trading-journal/trending-pairs?chain=${chain}`);
  },
};

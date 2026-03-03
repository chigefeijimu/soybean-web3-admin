import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

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

@Injectable()
export class DexTradingJournalService {
  private readonly chains = [
    'ethereum',
    'arbitrum',
    'optimism',
    'polygon',
    'bsc',
    'base',
    'avalanche',
  ];
  private readonly dexes = [
    'uniswap',
    'sushiswap',
    'pancakeswap',
    'quickswap',
    'curve',
    'balancer',
    'aerodrome',
    'velodrome',
  ];

  constructor(private readonly httpService: HttpService) {}

  async getDexTrades(address: string, chain?: string, dex?: string): Promise<DexTrade[]> {
    const chainsToQuery = chain ? [chain] : this.chains;
    const allTrades: DexTrade[] = [];

    for (const chain of chainsToQuery) {
      try {
        const trades = await this.fetchDexTrades(address, chain, dex);
        allTrades.push(...trades);
      } catch (error) {
        console.error(`Error fetching trades for ${chain}:`, error);
      }
    }

    return allTrades.sort((a, b) => b.timestamp - a.timestamp);
  }

  private async fetchDexTrades(address: string, chain: string, dex?: string): Promise<DexTrade[]> {
    // Mock data for demonstration - in production, would integrate with DEX APIs
    const mockTrades: DexTrade[] = [];
    const now = Date.now();
    
    const numTrades = Math.floor(Math.random() * 20) + 5;
    const dexList = dex ? [dex] : this.dexes.slice(0, Math.floor(Math.random() * 4) + 1);
    const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI', 'AAVE', 'LINK'];

    for (let i = 0; i < numTrades; i++) {
      const fromToken = tokens[Math.floor(Math.random() * tokens.length)];
      let toToken = tokens[Math.floor(Math.random() * tokens.length)];
      while (toToken === fromToken) {
        toToken = tokens[Math.floor(Math.random() * tokens.length)];
      }

      const fromAmount = (Math.random() * 10).toFixed(4);
      const toAmount = (Math.random() * 10000).toFixed(4);
      const fromValue = parseFloat(fromAmount) * (Math.random() * 3000 + 100);
      const toValue = parseFloat(toAmount) * (Math.random() * 2 + 0.5);

      mockTrades.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        chain,
        dex: dexList[Math.floor(Math.random() * dexList.length)],
        timestamp: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        fromValue,
        toValue,
        gasFee: Math.random() * 50 + 5,
        priceImpact: (Math.random() - 0.5) * 2,
        status: Math.random() > 0.1 ? 'success' : 'failed',
      });
    }

    return mockTrades;
  }

  async getTradingStats(address: string, chain?: string, dex?: string): Promise<TradingStats> {
    const trades = await this.getDexTrades(address, chain, dex);
    
    if (trades.length === 0) {
      return this.getEmptyStats();
    }

    const successfulTrades = trades.filter(t => t.status === 'success');
    const totalVolume = successfulTrades.reduce((sum, t) => sum + t.fromValue, 0);
    const totalFees = successfulTrades.reduce((sum, t) => sum + t.gasFee, 0);
    const averageTradeSize = totalVolume / successfulTrades.length;

    // Calculate PnL (simplified - comparing swap values)
    let profitableTrades = 0;
    let losingTrades = 0;
    let bestTrade = successfulTrades[0];
    let worstTrade = successfulTrades[0];

    for (const trade of successfulTrades) {
      const pnl = trade.toValue - trade.fromValue;
      if (pnl > 0) {
        profitableTrades++;
      } else {
        losingTrades++;
      }
      
      const tradePnl = trade.toValue - trade.fromValue;
      if (tradePnl > (bestTrade.toValue - bestTrade.fromValue)) {
        bestTrade = trade;
      }
      if (tradePnl < (worstTrade.toValue - worstTrade.fromValue)) {
        worstTrade = trade;
      }
    }

    // Chain distribution
    const chainDistribution: Record<string, number> = {};
    for (const trade of successfulTrades) {
      chainDistribution[trade.chain] = (chainDistribution[trade.chain] || 0) + trade.fromValue;
    }

    // DEX distribution
    const dexDistribution: Record<string, number> = {};
    for (const trade of successfulTrades) {
      dexDistribution[trade.dex] = (dexDistribution[trade.dex] || 0) + trade.fromValue;
    }

    // Most used DEX
    const dexCounts: Record<string, number> = {};
    for (const trade of successfulTrades) {
      dexCounts[trade.dex] = (dexCounts[trade.dex] || 0) + 1;
    }
    const mostUsedDex = Object.entries(dexCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Most traded pair
    const pairCounts: Record<string, number> = {};
    for (const trade of successfulTrades) {
      const pair = `${trade.fromToken}/${trade.toToken}`;
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    }
    const mostTradedPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Daily volume
    const dailyVolumeMap: Record<string, number> = {};
    const tradeCountByDayMap: Record<string, number> = {};
    
    for (const trade of successfulTrades) {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      dailyVolumeMap[date] = (dailyVolumeMap[date] || 0) + trade.fromValue;
      tradeCountByDayMap[date] = (tradeCountByDayMap[date] || 0) + 1;
    }

    const dailyVolume = Object.entries(dailyVolumeMap)
      .map(([date, volume]) => ({ date, volume }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const tradeCountByDay = Object.entries(tradeCountByDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalVolume,
      totalTrades: successfulTrades.length,
      totalFees,
      averageTradeSize,
      profitableTrades,
      losingTrades,
      winRate: successfulTrades.length > 0 ? profitableTrades / successfulTrades.length : 0,
      bestTrade,
      worstTrade,
      mostUsedDex,
      mostTradedPair,
      chainDistribution,
      dexDistribution,
      dailyVolume,
      tradeCountByDay,
    };
  }

  private getEmptyStats(): TradingStats {
    return {
      totalVolume: 0,
      totalTrades: 0,
      totalFees: 0,
      averageTradeSize: 0,
      profitableTrades: 0,
      losingTrades: 0,
      winRate: 0,
      bestTrade: null,
      worstTrade: null,
      mostUsedDex: 'N/A',
      mostTradedPair: 'N/A',
      chainDistribution: {},
      dexDistribution: {},
      dailyVolume: [],
      tradeCountByDay: [],
    };
  }

  async getTopTraders(chain?: string, limit: number = 10): Promise<{ address: string; volume: number; trades: number }[]> {
    // Generate mock top traders
    const traders: { address: string; volume: number; trades: number }[] = [];
    for (let i = 0; i < limit; i++) {
      traders.push({
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        volume: Math.random() * 10000000 + 100000,
        trades: Math.floor(Math.random() * 500) + 10,
      });
    }
    return traders.sort((a, b) => b.volume - a.volume);
  }

  async getDexPerformance(chain?: string): Promise<{
    dex: string;
    volume24h: number;
    trades24h: number;
    avgGas: number;
  }[]> {
    const performance: { dex: string; volume24h: number; trades24h: number; avgGas: number }[] = [];
    for (const dex of this.dexes) {
      performance.push({
        dex,
        volume24h: Math.random() * 100000000 + 10000000,
        trades24h: Math.floor(Math.random() * 50000) + 1000,
        avgGas: Math.random() * 30 + 5,
      });
    }
    return performance.sort((a, b) => b.volume24h - a.volume24h);
  }

  async getTrendingPairs(chain: string = 'ethereum'): Promise<{
    pair: string;
    volume24h: number;
    priceChange24h: number;
    dex: string;
  }[]> {
    const pairs = [
      'ETH/USDC', 'ETH/USDT', 'WBTC/ETH', 'ETH/DAI', 'UNI/ETH',
      'AAVE/ETH', 'LINK/ETH', 'USDC/USDT', 'ETH/SOL', 'MATIC/ETH',
    ];
    
    const result: { pair: string; volume24h: number; priceChange24h: number; dex: string }[] = pairs.map(pair => ({
      pair,
      volume24h: Math.random() * 50000000 + 1000000,
      priceChange24h: (Math.random() - 0.5) * 20,
      dex: this.dexes[Math.floor(Math.random() * this.dexes.length)],
    }));
    return result.sort((a, b) => b.volume24h - a.volume24h);
  }
}

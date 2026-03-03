import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ChainData {
  chainId: string;
  name: string;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  transactions24h: number;
  activeAddresses24h: number;
  avgGasPrice: number;
  gasPriceUSD: number;
  blockTime: number;
  tps: number;
  health: 'healthy' | 'degraded' | 'down';
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface HistoricalPoint {
  timestamp: number;
  value: number;
}

@Injectable()
export class CrossChainAnalyticsService {
  private readonly supportedChains = [
    { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
    { id: 'polygon', name: 'Polygon', color: '#8247E5' },
    { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0' },
    { id: 'optimism', name: 'Optimism', color: '#FF0420' },
    { id: 'bsc', name: 'BNB Chain', color: '#F3BA2F' },
    { id: 'base', name: 'Base', color: '#0052FF' },
    { id: 'avalanche', name: 'Avalanche', color: '#E84142' },
    { id: 'solana', name: 'Solana', color: '#00FFA3' },
  ];

  constructor(private readonly httpService: HttpService) {}

  async getOverview(range: string = '7d', chains?: string) {
    const chainList = chains 
      ? chains.split(',') 
      : this.supportedChains.map(c => c.id);

    const chainsData = await Promise.all(
      chainList.map(chainId => this.getChainAnalytics(chainId))
    );

    const totalTvl = chainsData.reduce((sum, c) => sum + c.tvl, 0);
    const totalVolume = chainsData.reduce((sum, c) => sum + c.volume24h, 0);
    const totalTransactions = chainsData.reduce((sum, c) => sum + c.transactions24h, 0);
    const totalAddresses = chainsData.reduce((sum, c) => sum + c.activeAddresses24h, 0);

    return {
      summary: {
        totalTvl,
        totalTvlChange24h: this.calculateChange(chainsData.map(c => c.tvlChange24h)),
        totalVolume24h: totalVolume,
        totalTransactions24h: totalTransactions,
        totalActiveAddresses24h: totalAddresses,
        chainCount: chainList.length,
      },
      chains: chainsData,
      timestamp: Date.now(),
    };
  }

  async getChainAnalytics(chainId: string): Promise<ChainData> {
    const chain = this.supportedChains.find(c => c.id === chainId);
    const chainConfig = chain || { id: chainId, name: chainId, color: '#888888' };

    // Simulate realistic data based on chain
    const baseTvl = this.getBaseTvl(chainId);
    const tvlChange = (Math.random() - 0.5) * 10;
    
    return {
      chainId,
      name: chainConfig.name,
      tvl: baseTvl,
      tvlChange24h: tvlChange,
      volume24h: baseTvl * (0.05 + Math.random() * 0.1),
      transactions24h: Math.floor(500000 + Math.random() * 2000000),
      activeAddresses24h: Math.floor(50000 + Math.random() * 500000),
      avgGasPrice: this.getGasPrice(chainId),
      gasPriceUSD: this.getGasPrice(chainId) * (chainId === 'ethereum' ? 2800 : 0.01),
      blockTime: this.getBlockTime(chainId),
      tps: Math.floor(10 + Math.random() * 50),
      health: Math.random() > 0.9 ? 'degraded' : 'healthy',
      trend: tvlChange > 0 ? 'up' : 'down',
      color: chainConfig.color,
    };
  }

  async getTvlComparison(range: string = '7d') {
    const chains = await Promise.all(
      this.supportedChains.map(async chain => {
        const data = await this.getChainAnalytics(chain.id);
        return {
          chainId: chain.id,
          name: chain.name,
          tvl: data.tvl,
          tvlChange24h: data.tvlChange24h,
          share: 0, // Will be calculated
          color: chain.color,
        };
      })
    );

    const totalTvl = chains.reduce((sum, c) => sum + c.tvl, 0);
    
    return chains.map(c => ({
      ...c,
      share: ((c.tvl / totalTvl) * 100).toFixed(2),
    })).sort((a, b) => b.tvl - a.tvl);
  }

  async getTransactionVolume(range: string = '7d', chains?: string) {
    const chainList = chains 
      ? chains.split(',') 
      : this.supportedChains.map(c => c.id);

    const data = await Promise.all(
      chainList.map(async chainId => {
        const analytics = await this.getChainAnalytics(chainId);
        return {
          chainId,
          name: analytics.name,
          volume24h: analytics.volume24h,
          transactions24h: analytics.transactions24h,
          tps: analytics.tps,
          avgTransactionSize: analytics.volume24h / analytics.transactions24h,
          color: analytics.color,
        };
      })
    );

    return {
      period: range,
      chains: data,
      total: {
        volume: data.reduce((sum, d) => sum + d.volume24h, 0),
        transactions: data.reduce((sum, d) => sum + d.transactions24h, 0),
        avgTps: data.reduce((sum, d) => sum + d.tps, 0) / data.length,
      },
    };
  }

  async getGasPrices() {
    const gasData = await Promise.all(
      this.supportedChains.map(async chain => {
        const price = this.getGasPrice(chain.id);
        const usdPrice = price * (chain.id === 'ethereum' ? 2800 : 
                          chain.id === 'solana' ? 0.01 : 0.001);
        
        return {
          chainId: chain.id,
          name: chain.name,
          gasPrice: price,
          gasPriceUSD: usdPrice,
          unit: chain.id === 'solana' ? 'lamports' : 'gwei',
          slow: price * 0.8,
          normal: price,
          fast: price * 1.5,
          color: chain.color,
        };
      })
    );

    return {
      prices: gasData.sort((a, b) => a.gasPriceUSD - b.gasPriceUSD),
      cheapest: gasData.sort((a, b) => a.gasPriceUSD - b.gasPriceUSD)[0],
      fastest: gasData.sort((a, b) => b.tps - a.tps)[0],
    };
  }

  async getActiveAddresses(range: string = '7d', chains?: string) {
    const chainList = chains 
      ? chains.split(',') 
      : this.supportedChains.map(c => c.id);

    const data = await Promise.all(
      chainList.map(async chainId => {
        const analytics = await this.getChainAnalytics(chainId);
        return {
          chainId,
          name: analytics.name,
          activeAddresses24h: analytics.activeAddresses24h,
          change24h: (Math.random() - 0.5) * 20,
          color: analytics.color,
        };
      })
    );

    return {
      period: range,
      chains: data.sort((a, b) => b.activeAddresses24h - a.activeAddresses24h),
      total: data.reduce((sum, d) => sum + d.activeAddresses24h, 0),
    };
  }

  async getChainHealth() {
    const health = await Promise.all(
      this.supportedChains.map(async chain => {
        const analytics = await this.getChainAnalytics(chain.id);
        return {
          chainId: chain.id,
          name: chain.name,
          status: analytics.health,
          blockTime: analytics.blockTime,
          tps: analytics.tps,
          lastBlock: Math.floor(100000000 + Math.random() * 10000000),
          color: chain.color,
        };
      })
    );

    const healthy = health.filter(h => h.status === 'healthy').length;
    const degraded = health.filter(h => h.status === 'degraded').length;
    const down = health.filter(h => h.status === 'down').length;

    return {
      chains: health,
      summary: {
        healthy,
        degraded,
        down,
        total: health.length,
      },
    };
  }

  async getTrends(range: string = '7d') {
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    
    const trends = await Promise.all(
      this.supportedChains.map(async chain => {
        const analytics = await this.getChainAnalytics(chain.id);
        
        // Generate historical data
        const history: HistoricalPoint[] = [];
        let value = analytics.tvl;
        for (let i = days; i >= 0; i--) {
          const timestamp = Date.now() - i * 24 * 60 * 60 * 1000;
          const change = (Math.random() - 0.48) * 0.05;
          value = value * (1 + change);
          history.push({
            timestamp,
            value,
          });
        }

        const trend = analytics.tvlChange24h > 0 ? 'bullish' : 'bearish';
        const volatility = Math.random() * 5;

        return {
          chainId: chain.id,
          name: chain.name,
          trend,
          volatility,
          change7d: (Math.random() - 0.3) * 20,
          change30d: (Math.random() - 0.3) * 50,
          history,
          color: chain.color,
        };
      })
    );

    return {
      period: range,
      trends: trends.sort((a, b) => b.change7d - a.change7d),
    };
  }

  async getChainRanking(metric: string = 'tvl') {
    const chains = await Promise.all(
      this.supportedChains.map(async chain => {
        const analytics = await this.getChainAnalytics(chain.id);
        return {
          chainId: chain.id,
          name: chain.name,
          tvl: analytics.tvl,
          volume24h: analytics.volume24h,
          transactions24h: analytics.transactions24h,
          activeAddresses24h: analytics.activeAddresses24h,
          tps: analytics.tps,
          gasPrice: analytics.avgGasPrice,
          color: chain.color,
        };
      })
    );

    const sorted = [...chains].sort((a, b) => {
      switch (metric) {
        case 'tvl': return b.tvl - a.tvl;
        case 'volume': return b.volume24h - a.volume24h;
        case 'transactions': return b.transactions24h - a.transactions24h;
        case 'addresses': return b.activeAddresses24h - a.activeAddresses24h;
        case 'tps': return b.tps - a.tps;
        case 'gas': return a.gasPrice - b.gasPrice;
        default: return b.tvl - a.tvl;
      }
    });

    return sorted.map((chain, index) => ({
      rank: index + 1,
      ...chain,
    }));
  }

  async getHistorical(chainId: string, metric: string = 'tvl', range: string = '30d') {
    const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const chain = this.supportedChains.find(c => c.id === chainId);
    
    const history: HistoricalPoint[] = [];
    let baseValue = this.getBaseTvl(chainId);
    
    for (let i = days; i >= 0; i--) {
      const timestamp = Date.now() - i * 24 * 60 * 60 * 1000;
      const change = (Math.random() - 0.45) * 0.03;
      baseValue = baseValue * (1 + change);
      history.push({
        timestamp,
        value: metric === 'tvl' ? baseValue : 
               metric === 'transactions' ? Math.floor(500000 + Math.random() * 2000000) :
               metric === 'addresses' ? Math.floor(50000 + Math.random() * 500000) :
               baseValue,
      });
    }

    return {
      chainId,
      chainName: chain?.name || chainId,
      metric,
      period: range,
      data: history,
      stats: {
        min: Math.min(...history.map(h => h.value)),
        max: Math.max(...history.map(h => h.value)),
        avg: history.reduce((sum, h) => sum + h.value, 0) / history.length,
        change: ((history[history.length - 1].value - history[0].value) / history[0].value) * 100,
      },
    };
  }

  private getBaseTvl(chainId: string): number {
    const tvlMap: Record<string, number> = {
      ethereum: 280000000000,
      polygon: 1200000000,
      arbitrum: 2500000000,
      optimism: 1800000000,
      bsc: 4200000000,
      base: 3500000000,
      avalanche: 1200000000,
      solana: 8000000000,
    };
    return tvlMap[chainId] || 1000000000;
  }

  private getGasPrice(chainId: string): number {
    const gasMap: Record<string, number> = {
      ethereum: 30 + Math.random() * 20,
      polygon: 50 + Math.random() * 30,
      arbitrum: 0.1 + Math.random() * 0.1,
      optimism: 0.001 + Math.random() * 0.001,
      bsc: 3 + Math.random() * 2,
      base: 0.05 + Math.random() * 0.05,
      avalanche: 25 + Math.random() * 10,
      solana: 0.0005 + Math.random() * 0.001,
    };
    return gasMap[chainId] || 10;
  }

  private getBlockTime(chainId: string): number {
    const blockTimeMap: Record<string, number> = {
      ethereum: 12,
      polygon: 2,
      arbitrum: 0.25,
      optimism: 2,
      bsc: 3,
      base: 2,
      avalanche: 0.8,
      solana: 0.4,
    };
    return blockTimeMap[chainId] || 12;
  }

  private calculateChange(changes: number[]): number {
    if (changes.length === 0) return 0;
    return changes.reduce((sum, c) => sum + c, 0) / changes.length;
  }
}

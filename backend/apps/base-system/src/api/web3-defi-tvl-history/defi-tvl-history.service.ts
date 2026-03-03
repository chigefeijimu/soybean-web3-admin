import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DefiTvlHistoryQueryDto, ProtocolTvlHistoryDto, TvlTrendDto, TvlStatisticsDto } from './defi-tvl-history.dto';

interface DefiLlamaProtocol {
  name: string;
  symbol: string;
  chain: string;
  tvl: number;
  category?: string;
}

interface DefiLlamaTvlPoint {
  date: number;
  tvl: number;
}

@Injectable()
export class DefiTvlHistoryService {
  private readonly logger = new Logger(DefiTvlHistoryService.name);
  private readonly defiLlamaBaseUrl = 'https://api.llama.fi';

  // Popular DeFi protocols by chain
  private readonly popularProtocols: Record<string, string[]> = {
    ethereum: ['Aave', 'Uniswap', 'MakerDAO', 'Compound', 'Lido', 'Curve', 'Yearn', 'ENS', 'Synthetix', 'Convex'],
    arbitrum: ['Aave', 'Uniswap', 'GMX', 'Curve', 'SushiSwap', 'Trader Joe', 'Synapse', 'Mai', 'Camelot', 'DODO'],
    optimism: ['Aave', 'Uniswap', 'Velodrome', 'Curve', 'Synthetix', 'Perpetual', 'Krom', 'Beethoven', 'Lyra', 'Kwenta'],
    polygon: ['Aave', 'Uniswap', 'QuickSwap', 'Curve', 'SushiSwap', 'Balancer', 'DODO', 'Gamma', 'Mai', 'Stargate'],
    bsc: ['PancakeSwap', 'Venus', 'Apollo', 'Alpaca', 'MDEX', 'Biswap', 'Thena', 'Jetfuel', 'CafeSwap', 'ChefInu'],
    base: ['Aave', 'Uniswap', 'Curve', 'Aerodrome', 'SushiSwap', 'Basin', 'Sky', 'PoolTogether', 'Rocket', ' morpho'],
    avalanche: ['Aave', 'Trader Joe', 'Curve', 'GMX', 'Stargate', 'Benqi', 'Platypus', 'Steady', 'Yeti', 'Vector'],
  };

  constructor(private readonly httpService: HttpService) {}

  async getTvlHistory(query: DefiTvlHistoryQueryDto): Promise<ProtocolTvlHistoryDto> {
    const { protocol, chain, timeframe = '30d' } = query;
    const chainValue = chain || 'ethereum';
    
    // Map timeframe to days
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
    };
    const days = daysMap[timeframe] || 30;

    try {
      // Get historical TVL data
      const url = `${this.defiLlamaBaseUrl}/historical/tvl/${protocol}`;
      const response = await firstValueFrom(this.httpService.get(url));
      
      let allData: DefiLlamaTvlPoint[] = response.data;
      
      // Filter by date range
      const now = Date.now();
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      allData = allData.filter((point: DefiLlamaTvlPoint) => point.date * 1000 >= cutoff);

      // Get current data
      let currentTvl = 0;
      try {
        const currentUrl = `${this.defiLlamaBaseUrl}/tvl/${protocol}`;
        const currentResponse = await firstValueFrom(this.httpService.get(currentUrl));
        currentTvl = currentResponse.data;
      } catch (e) {
        // Use last historical point
        if (allData.length > 0) {
          currentTvl = allData[allData.length - 1].tvl;
        }
      }

      // Calculate statistics
      const tvlValues = allData.map((p: DefiLlamaTvlPoint) => p.tvl);
      const avgTvl = tvlValues.length > 0 
        ? tvlValues.reduce((a: number, b: number) => a + b, 0) / tvlValues.length 
        : 0;
      
      const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
      const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
      
      // Calculate change
      const firstTvl = tvlValues.length > 0 ? tvlValues[0] : currentTvl;
      const change = firstTvl > 0 ? ((currentTvl - firstTvl) / firstTvl) * 100 : 0;

      return {
        protocol,
        chain: chainValue,
        currentTvl,
        history: allData.map((p: DefiLlamaTvlPoint) => ({
          date: new Date(p.date * 1000).toISOString(),
          tvl: p.tvl,
        })),
        statistics: {
          average: avgTvl,
          min: minTvl,
          max: maxTvl,
          change24h: change,
          volatility: this.calculateVolatility(tvlValues),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch TVL history for ${protocol}: ${error.message}`);
      throw new Error(`Protocol ${protocol} not found or API unavailable`);
    }
  }

  async getTvlTrends(): Promise<TvlTrendDto[]> {
    const trends: TvlTrendDto[] = [];
    
    for (const [chain, protocols] of Object.entries(this.popularProtocols)) {
      for (const protocol of protocols.slice(0, 3)) {
        try {
          const url = `${this.defiLlamaBaseUrl}/historical/tvl/${protocol}`;
          const response = await firstValueFrom(this.httpService.get(url));
          const data: DefiLlamaTvlPoint[] = response.data;
          
          if (data.length >= 2) {
            const recent = data.slice(-7);
            const older = data.slice(-14, -7);
            
            const recentAvg = recent.reduce((a, b) => a + b.tvl, 0) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b.tvl, 0) / older.length;
            
            const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
            
            trends.push({
              protocol,
              chain,
              currentTvl: data[data.length - 1].tvl,
              trend7d: trend,
              trendDirection: trend > 2 ? 'up' : trend < -2 ? 'down' : 'stable',
            });
          }
        } catch (e) {
          // Skip failed protocols
        }
      }
    }
    
    return trends.sort((a, b) => b.trend7d - a.trend7d).slice(0, 20);
  }

  async getTvlStatistics(chain?: string): Promise<TvlStatisticsDto> {
    let protocolsToFetch: string[] = [];
    
    if (chain && this.popularProtocols[chain]) {
      protocolsToFetch = this.popularProtocols[chain];
    } else {
      // Fetch from all chains
      Object.values(this.popularProtocols).forEach(protocols => {
        protocolsToFetch.push(...protocols.slice(0, 5));
      });
    }

    const protocolTvlData: { protocol: string; chain: string; tvl: number }[] = [];
    
    for (const protocol of protocolsToFetch.slice(0, 20)) {
      try {
        const url = `${this.defiLlamaBaseUrl}/tvl/${protocol}`;
        const response = await firstValueFrom(this.httpService.get(url));
        const tvl = response.data;
        
        // Determine chain
        let chain = 'ethereum';
        for (const [c, protos] of Object.entries(this.popularProtocols)) {
          if (protos.includes(protocol)) {
            chain = c;
            break;
          }
        }
        
        protocolTvlData.push({ protocol, chain, tvl });
      } catch (e) {
        // Skip
      }
    }

    const totalTvl = protocolTvlData.reduce((sum, p) => sum + p.tvl, 0);
    
    // Chain distribution
    const chainDistribution: Record<string, number> = {};
    for (const p of protocolTvlData) {
      chainDistribution[p.chain] = (chainDistribution[p.chain] || 0) + p.tvl;
    }

    // Top protocols
    const topProtocols = protocolTvlData
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10)
      .map(p => ({
        name: p.protocol,
        tvl: p.tvl,
        share: totalTvl > 0 ? (p.tvl / totalTvl) * 100 : 0,
      }));

    return {
      totalTvl,
      protocolCount: protocolTvlData.length,
      chainDistribution: Object.entries(chainDistribution).map(([chain, tvl]) => ({
        chain,
        tvl,
        share: totalTvl > 0 ? (tvl / totalTvl) * 100 : 0,
      })),
      topProtocols,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getChainTvlHistory(chain: string, timeframe = '30d'): Promise<{ chain: string; history: { date: string; tvl: number }[] }> {
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
    };
    const days = daysMap[timeframe] || 30;

    try {
      const url = `${this.defiLlamaBaseUrl}/charts/${chain}`;
      const response = await firstValueFrom(this.httpService.get(url));
      
      let data = response.data as DefiLlamaTvlPoint[];
      
      // Filter by date range
      const now = Date.now();
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      data = data.filter((point: DefiLlamaTvlPoint) => point.date * 1000 >= cutoff);

      return {
        chain,
        history: data.map((p: DefiLlamaTvlPoint) => ({
          date: new Date(p.date * 1000).toISOString(),
          tvl: p.tvl,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch chain TVL history for ${chain}: ${error.message}`);
      throw new Error(`Chain ${chain} not found or API unavailable`);
    }
  }

  async searchProtocols(query: string): Promise<{ name: string; chain: string; tvl: number }[]> {
    try {
      const url = `${this.defiLlamaBaseUrl}/overview/defi`;
      const response = await firstValueFrom(this.httpService.get(url));
      
      const allProtocols: DefiLlamaProtocol[] = response.data.protocols || [];
      
      const filtered = allProtocols
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 20)
        .map(p => ({
          name: p.name,
          chain: p.chain,
          tvl: p.tvl,
        }));

      return filtered;
    } catch (error) {
      this.logger.error(`Failed to search protocols: ${error.message}`);
      return [];
    }
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Return coefficient of variation as percentage
    return mean > 0 ? (stdDev / mean) * 100 : 0;
  }
}

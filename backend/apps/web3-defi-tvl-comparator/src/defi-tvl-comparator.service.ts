import { Injectable } from '@nestjs/common';

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

export interface TVLHistory {
  date: string;
  tvl: number;
}

export interface ChainTVL {
  chain: string;
  tvl: number;
  tvlChange24h: number;
  changePercent: number;
  dominantProtocol: string;
}

export interface TVLComparison {
  protocols: ProtocolTVL[];
  chains: ChainTVL[];
  totalTVL: number;
  totalTVLChange24h: number;
  historicalTrend: TVLHistory[];
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

@Injectable()
export class DefiTvlComparatorService {
  private readonly protocols = [
    { id: 'uniswap', name: 'Uniswap', category: 'dex' as const, chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'] },
    { id: 'aave', name: 'Aave', category: 'lending' as const, chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'] },
    { id: 'curve', name: 'Curve', category: 'dex' as const, chains: ['ethereum', 'arbitrum', 'optimism', 'polygon'] },
    { id: 'lido', name: 'Lido', category: 'staking' as const, chains: ['ethereum'] },
    { id: 'makerdao', name: 'MakerDAO', category: 'lending' as const, chains: ['ethereum'] },
    { id: 'compound', name: 'Compound', category: 'lending' as const, chains: ['ethereum', 'arbitrum', 'optimism'] },
    { id: 'yearn', name: 'Yearn Finance', category: 'yield' as const, chains: ['ethereum', 'arbitrum', 'fantom'] },
    { id: 'balancer', name: 'Balancer', category: 'dex' as const, chains: ['ethereum', 'arbitrum', 'polygon', 'optimism'] },
    { id: 'sushiswap', name: 'SushiSwap', category: 'dex' as const, chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche'] },
    { id: 'morpho', name: 'Morpho', category: 'lending' as const, chains: ['ethereum', 'arbitrum', 'optimism'] },
    { id: 'gearbox', name: 'Gearbox', category: 'lending' as const, chains: ['ethereum', 'arbitrum'] },
    { id: 'convex', name: 'Convex Finance', category: 'yield' as const, chains: ['ethereum'] },
    { id: 'rocketpool', name: 'Rocket Pool', category: 'staking' as const, chains: ['ethereum'] },
    { id: 'stargate', name: 'Stargate', category: 'bridge' as const, chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc'] },
    { id: 'layerzero', name: 'LayerZero', category: 'bridge' as const, chains: ['ethereum', 'avalanche', 'polygon', 'arbitrum', 'optimism'] },
    { id: 'dydx', name: 'dYdX', category: 'derivatives' as const, chains: ['ethereum'] },
    { id: 'gmx', name: 'GMX', category: 'derivatives' as const, chains: ['arbitrum', 'avalanche'] },
    { id: 'pendle', name: 'Pendle', category: 'yield' as const, chains: ['ethereum', 'arbitrum', 'optimism', 'polygon'] },
    { id: 'across', name: 'Across', category: 'bridge' as const, chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'] },
    { id: 'aerodrome', name: 'Aerodrome', category: 'dex' as const, chains: ['base'] },
  ];

  private readonly chainNames: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    base: 'Base',
    avalanche: 'Avalanche',
    bsc: 'BNB Chain',
    fantom: 'Fantom',
  };

  private generateMockTVL(protocolId: string, chain: string): number {
    const baseTVLs: Record<string, number> = {
      uniswap: 8000000000,
      aave: 15000000000,
      curve: 2500000000,
      lido: 35000000000,
      makerdao: 9000000000,
      compound: 5000000000,
      yearn: 3000000000,
      balancer: 1800000000,
      sushiswap: 1200000000,
      morpho: 2500000000,
      gearbox: 400000000,
      convex: 3500000000,
      rocketpool: 1500000000,
      stargate: 500000000,
      layerzero: 800000000,
      dydx: 400000000,
      gmx: 600000000,
      pendle: 800000000,
      across: 300000000,
      aerodrome: 350000000,
    };

    const base = baseTVLs[protocolId] || 1000000000;
    const chainMultiplier = chain === 'ethereum' ? 1 : chain === 'arbitrum' ? 0.3 : chain === 'polygon' ? 0.2 : chain === 'optimism' ? 0.15 : chain === 'base' ? 0.1 : chain === 'avalanche' ? 0.12 : 0.08;
    
    return base * chainMultiplier * (0.8 + Math.random() * 0.4);
  }

  async getTVLComparison(
    chains?: string[],
    categories?: string[],
    timeRange: string = '30d',
  ): Promise<TVLComparison> {
    const selectedChains = chains?.length ? chains : Object.keys(this.chainNames);
    const selectedCategories = categories?.length ? categories : ['dex', 'lending', 'staking', 'bridge', 'derivatives', 'yield'];

    // Generate protocol TVLs
    const protocolTVLs: ProtocolTVL[] = [];
    let rank = 1;

    for (const protocol of this.protocols) {
      if (!selectedCategories.includes(protocol.category)) continue;
      
      let totalTVL = 0;
      for (const chain of protocol.chains) {
        if (selectedChains.includes(chain)) {
          totalTVL += this.generateMockTVL(protocol.id, chain);
        }
      }

      if (totalTVL > 0) {
        protocolTVLs.push({
          id: protocol.id,
          name: protocol.name,
          category: protocol.category,
          chain: protocol.chains[0],
          tvl: Math.round(totalTVL),
          tvlChange24h: Math.round((Math.random() - 0.4) * 10 * 100) / 100,
          tvlChange7d: Math.round((Math.random() - 0.3) * 30 * 100) / 100,
          tvlChange30d: Math.round((Math.random() - 0.2) * 60 * 100) / 100,
          rank: rank++,
        });
      }
    }

    // Sort by TVL
    protocolTVLs.sort((a, b) => b.tvl - a.tvl);
    protocolTVLs.forEach((p, i) => p.rank = i + 1);

    // Generate chain TVLs
    const chainTVLs: ChainTVL[] = selectedChains.map(chain => {
      const chainProtocols = protocolTVLs.filter(p => 
        this.protocols.find(proto => 
          proto.id === p.id && proto.chains.includes(chain)
        )
      );
      
      return {
        chain: this.chainNames[chain] || chain,
        tvl: Math.round(chainProtocols.reduce((sum, p) => sum + p.tvl, 0)),
        tvlChange24h: Math.round((Math.random() - 0.4) * 5 * 100) / 100,
        changePercent: Math.round((Math.random() - 0.4) * 10 * 100) / 100,
        dominantProtocol: chainProtocols.sort((a, b) => b.tvl - a.tvl)[0]?.name || 'N/A',
      };
    });

    chainTVLs.sort((a, b) => b.tvl - a.tvl);

    // Generate historical trend
    const historicalTrend = this.generateHistoricalTrend(timeRange);

    const totalTVL = protocolTVLs.reduce((sum, p) => sum + p.tvl, 0);
    const totalTVLChange24h = protocolTVLs.length > 0 
      ? protocolTVLs.reduce((sum, p) => sum + p.tvlChange24h, 0) / protocolTVLs.length 
      : 0;

    return {
      protocols: protocolTVLs,
      chains: chainTVLs,
      totalTVL: Math.round(totalTVL),
      totalTVLChange24h: Math.round(totalTVLChange24h * 100) / 100,
      historicalTrend,
    };
  }

  private generateHistoricalTrend(timeRange: string): TVLHistory[] {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const trend: TVLHistory[] = [];
    const now = new Date();
    let baseTVL = 80000000000; // 80B base

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some realistic variation
      const change = (Math.random() - 0.48) * 0.02;
      baseTVL = baseTVL * (1 + change);
      
      trend.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.round(baseTVL),
      });
    }

    return trend;
  }

  async getProtocolDetails(protocolId: string): Promise<any> {
    const protocol = this.protocols.find(p => p.id === protocolId);
    if (!protocol) return null;

    const chainBreakdown = await Promise.all(
      protocol.chains.map(async (chain) => ({
        chain: this.chainNames[chain] || chain,
        tvl: Math.round(this.generateMockTVL(protocolId, chain)),
        tvlShare: 0,
        rank: Math.floor(Math.random() * 50) + 1,
      }))
    );

    const totalTVL = chainBreakdown.reduce((sum, c) => sum + c.tvl, 0);
    chainBreakdown.forEach(c => {
      c.tvlShare = Math.round((c.tvl / totalTVL) * 10000) / 100;
    });

    const historicalTrend = this.generateHistoricalTrend('90d');

    return {
      id: protocol.id,
      name: protocol.name,
      category: protocol.category,
      chains: protocol.chains.map(c => this.chainNames[c] || c),
      chainBreakdown,
      totalTVL,
      tvlChange24h: Math.round((Math.random() - 0.4) * 10 * 100) / 100,
      tvlChange7d: Math.round((Math.random() - 0.3) * 30 * 100) / 100,
      tvlChange30d: Math.round((Math.random() - 0.2) * 60 * 100) / 100,
      historicalTrend,
      topHolderPercent: Math.round(10 + Math.random() * 30),
      avgGasCost: Math.floor(Math.random() * 50) + 10,
    };
  }

  async getTVLTrends(protocolIds: string[], timeRange: string = '30d'): Promise<TVLTrendAnalysis[]> {
    const trends: TVLTrendAnalysis[] = [];

    for (const protocolId of protocolIds) {
      const protocol = this.protocols.find(p => p.id === protocolId);
      if (!protocol) continue;

      const historicalData = this.generateHistoricalTrend(timeRange);
      const firstTVL = historicalData[0]?.tvl || 1;
      const lastTVL = historicalData[historicalData.length - 1]?.tvl || 1;
      const changePercent = ((lastTVL - firstTVL) / firstTVL) * 100;

      // Calculate volatility
      const tvls = historicalData.map(d => d.tvl);
      const avgTVL = tvls.reduce((a, b) => a + b, 0) / tvls.length;
      const variance = tvls.reduce((sum, tvl) => sum + Math.pow(tvl - avgTVL, 2), 0) / tvls.length;
      const volatility = Math.sqrt(variance) / avgTVL * 100;

      trends.push({
        protocolId,
        trend: changePercent > 5 ? 'growing' : changePercent < -5 ? 'declining' : 'stable',
        changePercent: Math.round(changePercent * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        prediction: {
          next7d: Math.round(lastTVL * (1 + (Math.random() - 0.5) * 0.1)),
          next30d: Math.round(lastTVL * (1 + (Math.random() - 0.3) * 0.3)),
          confidence: Math.round(60 + Math.random() * 30),
        },
      });
    }

    return trends;
  }

  async getTopGainers(limit: number = 10, period: string = '24h'): Promise<ProtocolTVL[]> {
    const comparison = await this.getTVLComparison();
    
    let sortedProtocols: ProtocolTVL[];
    switch (period) {
      case '7d':
        sortedProtocols = comparison.protocols.sort((a, b) => b.tvlChange7d - a.tvlChange7d);
        break;
      case '30d':
        sortedProtocols = comparison.protocols.sort((a, b) => b.tvlChange30d - a.tvlChange30d);
        break;
      default:
        sortedProtocols = comparison.protocols.sort((a, b) => b.tvlChange24h - a.tvlChange24h);
    }

    return sortedProtocols.slice(0, limit);
  }

  async getCategoryBreakdown(): Promise<any> {
    const categories = ['dex', 'lending', 'staking', 'bridge', 'derivatives', 'yield', 'nft'];
    const comparison = await this.getTVLComparison();

    const breakdown = categories.map(category => {
      const categoryProtocols = comparison.protocols.filter(p => p.category === category);
      const totalTVL = categoryProtocols.reduce((sum, p) => sum + p.tvl, 0);
      
      return {
        category,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        totalTVL,
        protocolCount: categoryProtocols.length,
        sharePercent: Math.round((totalTVL / comparison.totalTVL) * 10000) / 100,
        topProtocol: categoryProtocols.sort((a, b) => b.tvl - a.tvl)[0]?.name || 'N/A',
      };
    });

    return breakdown.sort((a, b) => b.totalTVL - a.totalTVL);
  }

  getSupportedChains(): { id: string; name: string }[] {
    return Object.entries(this.chainNames).map(([id, name]) => ({ id, name }));
  }

  getSupportedCategories(): string[] {
    return ['dex', 'lending', 'staking', 'bridge', 'derivatives', 'yield', 'nft'];
  }
}

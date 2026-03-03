import { Injectable } from '@nestjs/common';

interface Protocol {
  id: string;
  name: string;
  category: string;
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  volume24h: number;
  fees24h: number;
  revenue24h: number;
  apy?: number;
  logoUrl: string;
  description?: string;
  website?: string;
  twitter?: string;
}

interface ChainStats {
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  numProtocols: number;
  dominantProtocol: string;
  categoryBreakdown: Record<string, number>;
}

@Injectable()
export class DefiMarketOverviewService {
  private readonly supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc', 'base', 'solana'
  ];

  private readonly categories = [
    'lending', 'dexes', 'yield', 'bridge', 'derivatives', ' stables', 'nft', 'options', 'lottery'
  ];

  private generateMockProtocols(): Protocol[] {
    const protocols: Protocol[] = [
      // Lending
      { id: 'aave-v3', name: 'Aave V3', category: 'lending', chain: 'ethereum', tvl: 15600000000, tvlChange24h: 2.3, tvlChange7d: 5.8, volume24h: 420000000, fees24h: 2800000, revenue24h: 1900000, apy: 4.2, logoUrl: 'https://app.aave.com/favicon.svg', description: 'Leading decentralized lending protocol', website: 'https://aave.com' },
      { id: 'aave-v3-polygon', name: 'Aave V3 Polygon', category: 'lending', chain: 'polygon', tvl: 1200000000, tvlChange24h: 1.8, tvlChange7d: 4.2, volume24h: 35000000, fees24h: 180000, revenue24h: 120000, apy: 5.1, logoUrl: 'https://app.aave.com/favicon.svg' },
      { id: 'aave-v3-arbitrum', name: 'Aave V3 Arbitrum', category: 'lending', chain: 'arbitrum', tvl: 2100000000, tvlChange24h: 3.1, tvlChange7d: 8.5, volume24h: 85000000, fees24h: 420000, revenue24h: 280000, apy: 5.8, logoUrl: 'https://app.aave.com/favicon.svg' },
      { id: 'compound', name: 'Compound', category: 'lending', chain: 'ethereum', tvl: 3200000000, tvlChange24h: 1.2, tvlChange7d: 3.5, volume24h: 180000000, fees24h: 950000, revenue24h: 620000, apy: 3.8, logoUrl: 'compound.finance/favicon.ico' },
      { id: 'morpho', name: 'Morpho', category: 'lending', chain: 'ethereum', tvl: 4500000000, tvlChange24h: 4.2, tvlChange7d: 12.5, volume24h: 320000000, fees24h: 1800000, revenue24h: 1200000, apy: 4.5, logoUrl: 'https://morpho.org/favicon.svg' },
      { id: 'liquity', name: 'Liquity', category: 'lending', chain: 'ethereum', tvl: 280000000, tvlChange24h: -0.8, tvlChange7d: -2.1, volume24h: 12000000, fees24h: 65000, revenue24h: 42000, apy: 6.2, logoUrl: 'https://www.liquity.org/favicon.ico' },

      // DEXes
      { id: 'uniswap-v3', name: 'Uniswap V3', category: 'dexes', chain: 'ethereum', tvl: 8500000000, tvlChange24h: 1.5, tvlChange7d: 4.2, volume24h: 1800000000, fees24h: 8500000, revenue24h: 8500000, logoUrl: 'uniswap.org/favicon.ico' },
      { id: 'uniswap-v3-arbitrum', name: 'Uniswap V3 Arbitrum', category: 'dexes', chain: 'arbitrum', tvl: 1800000000, tvlChange24h: 2.8, tvlChange7d: 7.5, volume24h: 520000000, fees24h: 2100000, revenue24h: 2100000, logoUrl: 'uniswap.org/favicon.ico' },
      { id: 'uniswap-v3-optimism', name: 'Uniswap V3 Optimism', category: 'dexes', chain: 'optimism', tvl: 950000000, tvlChange24h: 1.9, tvlChange7d: 5.2, volume24h: 280000000, fees24h: 1100000, revenue24h: 1100000, logoUrl: 'uniswap.org/favicon.ico' },
      { id: 'sushiswap', name: 'SushiSwap', category: 'dexes', chain: 'ethereum', tvl: 2100000000, tvlChange24h: 0.8, tvlChange7d: 2.5, volume24h: 320000000, fees24h: 1400000, revenue24h: 1400000, logoUrl: 'sushi.com/favicon.ico' },
      { id: 'curve', name: 'Curve Finance', category: 'dexes', chain: 'ethereum', tvl: 5200000000, tvlChange24h: 1.1, tvlChange7d: 3.2, volume24h: 850000000, fees24h: 4200000, revenue24h: 4200000, logoUrl: 'curve.fi/favicon.ico' },
      { id: 'pancakeswap', name: 'PancakeSwap', category: 'dexes', chain: 'bsc', tvl: 3200000000, tvlChange24h: 2.5, tvlChange7d: 6.8, volume24h: 420000000, fees24h: 1800000, revenue24h: 1800000, logoUrl: 'pancakeswap.com/favicon.ico' },
      { id: 'quickswap', name: 'QuickSwap', category: 'dexes', chain: 'polygon', tvl: 480000000, tvlChange24h: 1.8, tvlChange7d: 4.5, volume24h: 95000000, fees24h: 420000, revenue24h: 420000, logoUrl: 'quickswap.exchange/favicon.ico' },
      { id: 'trader-joe', name: 'Trader Joe', category: 'dexes', chain: 'avalanche', tvl: 850000000, tvlChange24h: 3.2, tvlChange7d: 8.5, volume24h: 180000000, fees24h: 720000, revenue24h: 720000, logoUrl: 'traderjoexyz.com/favicon.ico' },
      { id: 'velodrome', name: 'Velodrome', category: 'dexes', chain: 'optimism', tvl: 280000000, tvlChange24h: 4.5, tvlChange7d: 12.8, volume24h: 85000000, fees24h: 380000, revenue24h: 380000, logoUrl: 'velodrome.finance/favicon.svg' },

      // Yield / Farming
      { id: 'yearn', name: 'Yearn Finance', category: 'yield', chain: 'ethereum', tvl: 5800000000, tvlChange24h: 1.8, tvlChange7d: 4.5, volume24h: 180000000, fees24h: 1200000, revenue24h: 950000, apy: 8.5, logoUrl: 'yearn.finance/favicon.ico' },
      { id: 'convex', name: 'Convex Finance', category: 'yield', chain: 'ethereum', tvl: 3200000000, tvlChange24h: 0.9, tvlChange7d: 2.8, volume24h: 95000000, fees24h: 580000, revenue24h: 480000, apy: 12.5, logoUrl: 'convexfinance.com/favicon.ico' },
      { id: 'stader', name: 'Stader', category: 'yield', chain: 'ethereum', tvl: 1800000000, tvlChange24h: 2.1, tvlChange7d: 5.5, volume24h: 45000000, fees24h: 280000, revenue24h: 180000, apy: 5.2, logoUrl: 'staderlabs.com/favicon.ico' },
      { id: 'gearbox', name: 'Gearbox', category: 'yield', chain: 'ethereum', tvl: 450000000, tvlChange24h: 3.5, tvlChange7d: 9.2, volume24h: 120000000, fees24h: 720000, revenue24h: 520000, apy: 15.8, logoUrl: 'gearbox.fi/favicon.svg' },

      // Bridges
      { id: 'layerzero', name: 'LayerZero', category: 'bridge', chain: 'ethereum', tvl: 8500000000, tvlChange24h: 5.2, tvlChange7d: 15.8, volume24h: 2800000000, fees24h: 4200000, revenue24h: 2800000, logoUrl: 'layerzero.network/favicon.ico' },
      { id: 'stargate', name: 'Stargate', category: 'bridge', chain: 'ethereum', tvl: 2800000000, tvlChange24h: 2.8, tvlChange7d: 8.5, volume24h: 520000000, fees24h: 1800000, revenue24h: 1200000, logoUrl: 'stargate.finance/favicon.ico' },
      { id: 'wormhole', name: 'Wormhole', category: 'bridge', chain: 'ethereum', tvl: 4200000000, tvlChange24h: 3.5, tvlChange7d: 10.2, volume24h: 850000000, fees24h: 2800000, revenue24h: 1900000, logoUrl: 'wormhole.com/favicon.ico' },
      { id: 'across', name: 'Across', category: 'bridge', chain: 'ethereum', tvl: 1200000000, tvlChange24h: 4.2, tvlChange7d: 12.5, volume24h: 320000000, fees24h: 950000, revenue24h: 720000, logoUrl: 'across.to/favicon.ico' },
      { id: 'hop', name: 'Hop Protocol', category: 'bridge', chain: 'ethereum', tvl: 380000000, tvlChange24h: 1.5, tvlChange7d: 4.8, volume24h: 85000000, fees24h: 280000, revenue24h: 180000, logoUrl: 'hop.exchange/favicon.ico' },

      // Derivatives
      { id: 'gmx', name: 'GMX', category: 'derivatives', chain: 'arbitrum', tvl: 580000000, tvlChange24h: 5.8, tvlChange7d: 18.5, volume24h: 2800000000, fees24h: 8500000, revenue24h: 7200000, logoUrl: 'gmx.io/favicon.ico' },
      { id: 'gmx-avalanche', name: 'GMX Avalanche', category: 'derivatives', chain: 'avalanche', tvl: 280000000, tvlChange24h: 4.2, tvlChange7d: 14.2, volume24h: 1200000000, fees24h: 3800000, revenue24h: 3200000, logoUrl: 'gmx.io/favicon.ico' },
      { id: 'dydx', name: 'dYdX', category: 'derivatives', chain: 'ethereum', tvl: 380000000, tvlChange24h: 2.5, tvlChange7d: 7.8, volume24h: 1800000000, fees24h: 4200000, revenue24h: 3500000, logoUrl: 'dydx.exchange/favicon.ico' },

      // Liquid Staking
      { id: 'lido', name: 'Lido', category: 'liquid-staking', chain: 'ethereum', tvl: 32000000000, tvlChange24h: 1.8, tvlChange7d: 4.5, volume24h: 85000000, fees24h: 2800000, revenue24h: 1900000, apy: 3.8, logoUrl: 'lido.fi/favicon.ico' },
      { id: 'rocket-pool', name: 'Rocket Pool', category: 'liquid-staking', chain: 'ethereum', tvl: 2800000000, tvlChange24h: 2.5, tvlChange7d: 6.8, volume24h: 28000000, fees24h: 180000, revenue24h: 120000, apy: 4.2, logoUrl: 'rocketpool.net/favicon.ico' },
      { id: 'frax-ether', name: 'Frax Ether', category: 'liquid-staking', chain: 'ethereum', tvl: 1800000000, tvlChange24h: 3.2, tvlChange7d: 8.5, volume24h: 42000000, fees24h: 280000, revenue24h: 180000, apy: 4.5, logoUrl: 'frax.finance/favicon.ico' },
      { id: 'swell', name: 'Swell', category: 'liquid-staking', chain: 'ethereum', tvl: 850000000, tvlChange24h: 8.5, tvlChange7d: 25.2, volume24h: 18000000, fees24h: 95000, revenue24h: 72000, apy: 5.2, logoUrl: 'swellnetwork.io/favicon.ico' },

      // Stablecoins
      { id: 'makerdao', name: 'MakerDAO', category: 'stabes', chain: 'ethereum', tvl: 8500000000, tvlChange24h: 0.5, tvlChange7d: 1.2, volume24h: 180000000, fees24h: 1800000, revenue24h: 1200000, logoUrl: 'makerdao.com/favicon.ico' },
      { id: 'aave-stable', name: 'Aave Stablecoin', category: 'stabes', chain: 'ethereum', tvl: 5200000000, tvlChange24h: 2.8, tvlChange7d: 7.5, volume24h: 280000000, fees24h: 2200000, revenue24h: 1500000, logoUrl: 'https://app.aave.com/favicon.svg' },
    ];
    return protocols;
  }

  async getMarketOverview(chain?: string): Promise<any> {
    const protocols = this.generateMockProtocols();
    const filtered = chain ? protocols.filter(p => p.chain === chain) : protocols;

    const totalTvl = filtered.reduce((sum, p) => sum + p.tvl, 0);
    const totalVolume24h = filtered.reduce((sum, p) => sum + p.volume24h, 0);
    const totalFees24h = filtered.reduce((sum, p) => sum + p.fees24h, 0);
    const totalRevenue24h = filtered.reduce((sum, p) => sum + p.revenue24h, 0);

    const avgTvlChange24h = filtered.reduce((sum, p) => sum + p.tvlChange24h, 0) / filtered.length;
    const avgTvlChange7d = filtered.reduce((sum, p) => sum + p.tvlChange7d, 0) / filtered.length;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    filtered.forEach(p => {
      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + p.tvl;
    });

    // Chain breakdown
    const chainBreakdown: Record<string, number> = {};
    filtered.forEach(p => {
      chainBreakdown[p.chain] = (chainBreakdown[p.chain] || 0) + p.tvl;
    });

    return {
      totalTvl,
      totalVolume24h,
      totalFees24h,
      totalRevenue24h,
      avgTvlChange24h: Number(avgTvlChange24h.toFixed(2)),
      avgTvlChange7d: Number(avgTvlChange7d.toFixed(2)),
      numProtocols: filtered.length,
      categoryBreakdown: Object.fromEntries(
        Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)
      ),
      chainBreakdown: Object.fromEntries(
        Object.entries(chainBreakdown).sort(([, a], [, b]) => b - a)
      ),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getProtocols(
    chain?: string,
    category?: string,
    sort: string = 'tvl',
    limit: number = 50,
  ): Promise<any> {
    let protocols = this.generateMockProtocols();

    if (chain) {
      protocols = protocols.filter(p => p.chain === chain);
    }
    if (category) {
      protocols = protocols.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }

    // Sort
    switch (sort) {
      case 'tvl':
        protocols.sort((a, b) => b.tvl - a.tvl);
        break;
      case 'volume':
        protocols.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'fees':
        protocols.sort((a, b) => b.fees24h - a.fees24h);
        break;
      case 'change24h':
        protocols.sort((a, b) => b.tvlChange24h - a.tvlChange24h);
        break;
      case 'change7d':
        protocols.sort((a, b) => b.tvlChange7d - a.tvlChange7d);
        break;
    }

    return {
      protocols: protocols.slice(0, limit),
      total: protocols.length,
      sort,
      chain: chain || 'all',
      category: category || 'all',
    };
  }

  async getProtocolDetails(id: string): Promise<any> {
    const protocols = this.generateMockProtocols();
    const protocol = protocols.find(p => p.id === id);

    if (!protocol) {
      throw new Error(`Protocol ${id} not found`);
    }

    // Generate historical data
    const history7d: Array<{date: string; tvl: number; volume: number}> = [];
    const baseValue = protocol.tvl;
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const change = (Math.random() - 0.5) * 10 + (protocol.tvlChange7d / 7) * (6 - i);
      history7d.push({
        date: date.toISOString().split('T')[0],
        tvl: baseValue * (1 + change / 100),
        volume: protocol.volume24h * (0.8 + Math.random() * 0.4),
      });
    }

    return {
      ...protocol,
      history7d,
      riskScore: Math.floor(30 + Math.random() * 40),
      auditScore: Math.floor(70 + Math.random() * 25),
      communityScore: Math.floor(60 + Math.random() * 35),
      marketShare: (protocol.tvl / 85000000000) * 100,
      rank: protocols.sort((a, b) => b.tvl - a.tvl).findIndex(p => p.id === id) + 1,
    };
  }

  async getCategories(): Promise<any> {
    const protocols = this.generateMockProtocols();
    const categories: Record<string, any> = {};

    protocols.forEach(p => {
      if (!categories[p.category]) {
        categories[p.category] = {
          name: p.category,
          tvl: 0,
          numProtocols: 0,
          chains: new Set(),
        };
      }
      categories[p.category].tvl += p.tvl;
      categories[p.category].numProtocols++;
      categories[p.category].chains.add(p.chain);
    });

    return Object.values(categories).map((c: any) => ({
      ...c,
      chains: Array.from(c.chains),
    })).sort((a: any, b: any) => b.tvl - a.tvl);
  }

  async getTrends(period: string = '7d'): Promise<any> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const trends: Array<{date: string; tvl: number; change: number}> = [];
    const baseTvl = 85000000000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dailyChange = (Math.random() - 0.5) * 4;
      trends.push({
        date: date.toISOString().split('T')[0],
        tvl: baseTvl * (1 + dailyChange / 100 * (days - i) / days),
        change: dailyChange,
      });
    }

    return {
      period,
      trends,
      avgDailyChange: Number((trends.reduce((sum, t) => sum + t.change, 0) / days).toFixed(2)),
      totalChange: Number(((trends[trends.length - 1].tvl - trends[0].tvl) / trends[0].tvl * 100).toFixed(2)),
    };
  }

  async getTopGainersLosers(period: string = '24h'): Promise<any> {
    const protocols = this.generateMockProtocols();
    const sorted = [...protocols].sort((a, b) => {
      const changeA = period === '24h' ? a.tvlChange24h : a.tvlChange7d;
      const changeB = period === '24h' ? b.tvlChange24h : b.tvlChange7d;
      return changeB - changeA;
    });

    return {
      period,
      topGainers: sorted.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        change: period === '24h' ? p.tvlChange24h : p.tvlChange7d,
        tvl: p.tvl,
      })),
      topLosers: sorted.slice(-10).reverse().map(p => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        change: period === '24h' ? p.tvlChange24h : p.tvlChange7d,
        tvl: p.tvl,
      })),
    };
  }

  async getYieldOpportunities(chain?: string, minTvl: number = 1000000): Promise<any> {
    let protocols = this.generateMockProtocols().filter(p => p.apy);
    
    if (chain) {
      protocols = protocols.filter(p => p.chain === chain);
    }
    protocols = protocols.filter(p => p.tvl >= minTvl);

    const opportunities = protocols
      .map(p => ({
        protocol: p.name,
        chain: p.chain,
        category: p.category,
        apy: p.apy,
        tvl: p.tvl,
        tvlChange24h: p.tvlChange24h,
        riskLevel: p.tvl > 1000000000 ? 'low' : p.tvl > 100000000 ? 'medium' : 'high',
      }))
      .sort((a, b) => (b.apy || 0) - (a.apy || 0));

    return {
      opportunities,
      bestOpportunity: opportunities[0] || null,
      avgApy: opportunities.length > 0 
        ? Number((opportunities.reduce((sum, o) => sum + (o.apy || 0), 0) / opportunities.length).toFixed(2))
        : 0,
    };
  }

  async getChainStats(): Promise<any> {
    const protocols = this.generateMockProtocols();
    const chains: Record<string, ChainStats> = {};

    this.supportedChains.forEach(chain => {
      const chainProtocols = protocols.filter(p => p.chain === chain);
      const categoryBreakdown: Record<string, number> = {};
      
      chainProtocols.forEach(p => {
        categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + p.tvl;
      });

      const dominant = chainProtocols.sort((a, b) => b.tvl - a.tvl)[0];

      chains[chain] = {
        chain,
        tvl: chainProtocols.reduce((sum, p) => sum + p.tvl, 0),
        tvlChange24h: chainProtocols.length > 0 
          ? chainProtocols.reduce((sum, p) => sum + p.tvlChange24h, 0) / chainProtocols.length
          : 0,
        tvlChange7d: chainProtocols.length > 0 
          ? chainProtocols.reduce((sum, p) => sum + p.tvlChange7d, 0) / chainProtocols.length
          : 0,
        numProtocols: chainProtocols.length,
        dominantProtocol: dominant?.name || 'N/A',
        categoryBreakdown,
      };
    });

    const sortedChains = Object.values(chains).sort((a, b) => b.tvl - a.tvl);
    
    return {
      chains: sortedChains,
      dominantChain: sortedChains[0]?.chain || 'ethereum',
      totalTvl: sortedChains.reduce((sum, c) => sum + c.tvl, 0),
    };
  }

  async getHistoricalTvl(period: string = '30d', chain?: string): Promise<any> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const data: Array<{date: string; tvl: number; change: number}> = [];
    
    let baseTvl = chain 
      ? this.generateMockProtocols().filter(p => p.chain === chain).reduce((sum, p) => sum + p.tvl, 0)
      : 85000000000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dailyReturn = (Math.random() - 0.45) * 2;
      baseTvl = baseTvl * (1 + dailyReturn / 100);
      
      data.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.round(baseTvl),
        change: Number(dailyReturn.toFixed(2)),
      });
    }

    return {
      period,
      chain: chain || 'all',
      data,
      startTvl: data[0]?.tvl || 0,
      endTvl: data[data.length - 1]?.tvl || 0,
      changePercent: data.length > 1 
        ? Number(((data[data.length - 1].tvl - data[0].tvl) / data[0].tvl * 100).toFixed(2))
        : 0,
    };
  }

  async searchProtocols(query: string): Promise<any> {
    const protocols = this.generateMockProtocols();
    const q = query.toLowerCase();
    
    const results = protocols.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      p.chain.toLowerCase().includes(q)
    ).slice(0, 20);

    return {
      query,
      results: results.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        chain: p.chain,
        tvl: p.tvl,
      })),
      total: results.length,
    };
  }
}

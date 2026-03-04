import { Injectable } from '@nestjs/common';

interface ProtocolMetric {
  id: string;
  name: string;
  chain: string;
  category: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  volume24h: number;
  fees24h: number;
  revenue24h: number;
  users24h: number;
  avgApy: number;
  riskScore: number;
  auditStatus: 'audited' | 'partially-audited' | 'unaudited';
  chainId: string;
}

interface ChainMetrics {
  chain: string;
  chainId: string;
  totalTvl: number;
  protocolCount: number;
  topProtocols: ProtocolMetric[];
}

interface CategoryMetrics {
  category: string;
  totalTvl: number;
  protocolCount: number;
  avgApy: number;
  trend: 'up' | 'down' | 'stable';
}

@Injectable()
export class DefiProtocolMetricsService {
  private protocols: ProtocolMetric[] = [
    // Ethereum
    { id: 'uniswap-v3', name: 'Uniswap V3', chain: 'Ethereum', category: 'DEX', tvl: 5800000000, tvlChange24h: 2.5, tvlChange7d: 8.3, volume24h: 1250000000, fees24h: 3800000, revenue24h: 1900000, users24h: 125000, avgApy: 12.5, riskScore: 15, auditStatus: 'audited', chainId: '1' },
    { id: 'aave-v3', name: 'Aave V3', chain: 'Ethereum', category: 'Lending', tvl: 9500000000, tvlChange24h: 1.2, tvlChange7d: 5.6, volume24h: 180000000, fees24h: 520000, revenue24h: 380000, users24h: 18500, avgApy: 4.2, riskScore: 20, auditStatus: 'audited', chainId: '1' },
    { id: 'curve', name: 'Curve Finance', chain: 'Ethereum', category: 'DEX', tvl: 2200000000, tvlChange24h: -0.8, tvlChange7d: 3.2, volume24h: 450000000, fees24h: 890000, revenue24h: 445000, users24h: 42000, avgApy: 8.7, riskScore: 18, auditStatus: 'audited', chainId: '1' },
    { id: 'lido', name: 'Lido', chain: 'Ethereum', category: 'Liquid Staking', tvl: 32000000000, tvlChange24h: 1.8, tvlChange7d: 6.2, volume24h: 85000000, fees24h: 2100000, revenue24h: 1850000, users24h: 12500, avgApy: 3.8, riskScore: 12, auditStatus: 'audited', chainId: '1' },
    { id: 'yearn', name: 'Yearn Finance', chain: 'Ethereum', category: 'Yield Aggregator', tvl: 580000000, tvlChange24h: 3.2, tvlChange7d: 9.5, volume24h: 95000000, fees24h: 180000, revenue24h: 120000, users24h: 8500, avgApy: 15.8, riskScore: 28, auditStatus: 'audited', chainId: '1' },
    { id: 'compound', name: 'Compound', chain: 'Ethereum', category: 'Lending', tvl: 1200000000, tvlChange24h: 0.5, tvlChange7d: 2.8, volume24h: 125000000, fees24h: 380000, revenue24h: 280000, users24h: 12500, avgApy: 3.5, riskScore: 18, auditStatus: 'audited', chainId: '1' },
    { id: 'makerdao', name: 'MakerDAO', chain: 'Ethereum', category: 'Lending', tvl: 6800000000, tvlChange24h: -0.3, tvlChange7d: 1.5, volume24h: 280000000, fees24h: 1200000, revenue24h: 850000, users24h: 9500, avgApy: 2.8, riskScore: 22, auditStatus: 'audited', chainId: '1' },
    { id: 'balancer', name: 'Balancer', chain: 'Ethereum', category: 'DEX', tvl: 850000000, tvlChange24h: 1.5, tvlChange7d: 5.8, volume24h: 180000000, fees24h: 420000, revenue24h: 210000, users24h: 15000, avgApy: 9.2, riskScore: 20, auditStatus: 'audited', chainId: '1' },
    { id: 'sushiswap', name: 'SushiSwap', chain: 'Ethereum', category: 'DEX', tvl: 420000000, tvlChange24h: -1.2, tvlChange7d: 2.5, volume24h: 95000000, fees24h: 185000, revenue24h: 92000, users24h: 18500, avgApy: 11.8, riskScore: 25, auditStatus: 'audited', chainId: '1' },
    { id: 'morpho', name: 'Morpho', chain: 'Ethereum', category: 'Lending', tvl: 1800000000, tvlChange24h: 4.5, tvlChange7d: 12.3, volume24h: 250000000, fees24h: 680000, revenue24h: 450000, users24h: 8500, avgApy: 5.2, riskScore: 30, auditStatus: 'partially-audited', chainId: '1' },

    // Arbitrum
    { id: 'uniswap-v3-arbitrum', name: 'Uniswap V3', chain: 'Arbitrum', category: 'DEX', tvl: 1800000000, tvlChange24h: 3.2, tvlChange7d: 9.8, volume24h: 580000000, fees24h: 1250000, revenue24h: 625000, users24h: 45000, avgApy: 14.2, riskScore: 18, auditStatus: 'audited', chainId: '42161' },
    { id: 'aave-v3-arbitrum', name: 'Aave V3', chain: 'Arbitrum', category: 'Lending', tvl: 1200000000, tvlChange24h: 2.1, tvlChange7d: 7.5, volume24h: 185000000, fees24h: 420000, revenue24h: 310000, users24h: 12500, avgApy: 4.8, riskScore: 22, auditStatus: 'audited', chainId: '42161' },
    { id: 'GMX', name: 'GMX', chain: 'Arbitrum', category: 'Derivatives', tvl: 850000000, tvlChange24h: 5.2, tvlChange7d: 15.8, volume24h: 2800000000, fees24h: 4200000, revenue24h: 2100000, users24h: 28000, avgApy: 18.5, riskScore: 35, auditStatus: 'partially-audited', chainId: '42161' },
    { id: 'radiant', name: 'Radiant', chain: 'Arbitrum', category: 'Lending', tvl: 420000000, tvlChange24h: 1.8, tvlChange7d: 6.2, volume24h: 85000000, fees24h: 180000, revenue24h: 125000, users24h: 7500, avgApy: 5.5, riskScore: 28, auditStatus: 'audited', chainId: '42161' },
    { id: 'camelot', name: 'Camelot', chain: 'Arbitrum', category: 'DEX', tvl: 180000000, tvlChange24h: -2.5, tvlChange7d: -1.2, volume24h: 45000000, fees24h: 95000, revenue24h: 47000, users24h: 8500, avgApy: 13.5, riskScore: 32, auditStatus: 'partially-audited', chainId: '42161' },

    // Optimism
    { id: 'uniswap-v3-optimism', name: 'Uniswap V3', chain: 'Optimism', category: 'DEX', tvl: 950000000, tvlChange24h: 2.8, tvlChange7d: 8.5, volume24h: 320000000, fees24h: 680000, revenue24h: 340000, users24h: 28000, avgApy: 13.8, riskScore: 18, auditStatus: 'audited', chainId: '10' },
    { id: 'aave-v3-optimism', name: 'Aave V3', chain: 'Optimism', category: 'Lending', tvl: 680000000, tvlChange24h: 1.5, tvlChange7d: 5.2, volume24h: 95000000, fees24h: 220000, revenue24h: 165000, users24h: 8500, avgApy: 4.5, riskScore: 22, auditStatus: 'audited', chainId: '10' },
    { id: 'velodrome', name: 'Velodrome', chain: 'Optimism', category: 'DEX', tvl: 320000000, tvlChange24h: 4.2, tvlChange7d: 12.5, volume24h: 180000000, fees24h: 380000, revenue24h: 190000, users24h: 15000, avgApy: 12.8, riskScore: 25, auditStatus: 'audited', chainId: '10' },
    { id: 'optimism', name: 'Optimism', chain: 'Optimism', category: 'Liquid Staking', tvl: 850000000, tvlChange24h: 2.5, tvlChange7d: 8.2, volume24h: 45000000, fees24h: 180000, revenue24h: 145000, users24h: 5500, avgApy: 4.2, riskScore: 15, auditStatus: 'audited', chainId: '10' },

    // Polygon
    { id: 'aave-v3-polygon', name: 'Aave V3', chain: 'Polygon', category: 'Lending', tvl: 580000000, tvlChange24h: 0.8, tvlChange7d: 3.2, volume24h: 75000000, fees24h: 185000, revenue24h: 135000, users24h: 9500, avgApy: 5.2, riskScore: 22, auditStatus: 'audited', chainId: '137' },
    { id: 'quickswap', name: 'QuickSwap', chain: 'Polygon', category: 'DEX', tvl: 280000000, tvlChange24h: -0.5, tvlChange7d: 2.8, volume24h: 125000000, fees24h: 280000, revenue24h: 140000, users24h: 22000, avgApy: 10.5, riskScore: 28, auditStatus: 'audited', chainId: '137' },
    { id: 'curve-polygon', name: 'Curve', chain: 'Polygon', category: 'DEX', tvl: 180000000, tvlChange24h: 1.2, tvlChange7d: 4.5, volume24h: 85000000, fees24h: 180000, revenue24h: 90000, users24h: 12000, avgApy: 8.2, riskScore: 20, auditStatus: 'audited', chainId: '137' },
    { id: 'aero', name: 'Aerodrome', chain: 'Base', category: 'DEX', tvl: 280000000, tvlChange24h: 5.8, tvlChange7d: 18.5, volume24h: 220000000, fees24h: 480000, revenue24h: 240000, users24h: 18000, avgApy: 15.2, riskScore: 28, auditStatus: 'audited', chainId: '8453' },

    // Avalanche
    { id: 'aave-v3-avalanche', name: 'Aave V3', chain: 'Avalanche', category: 'Lending', tvl: 420000000, tvlChange24h: 1.2, tvlChange7d: 4.8, volume24h: 85000000, fees24h: 195000, revenue24h: 145000, users24h: 7500, avgApy: 5.8, riskScore: 25, auditStatus: 'audited', chainId: '43114' },
    { id: 'trader-joe', name: 'Trader Joe', chain: 'Avalanche', category: 'DEX', tvl: 380000000, tvlChange24h: 2.5, tvlChange7d: 8.2, volume24h: 180000000, fees24h: 380000, revenue24h: 190000, users24h: 25000, avgApy: 12.5, riskScore: 25, auditStatus: 'audited', chainId: '43114' },
    { id: 'curve-avalanche', name: 'Curve', chain: 'Avalanche', category: 'DEX', tvl: 150000000, tvlChange24h: 0.8, tvlChange7d: 3.5, volume24h: 65000000, fees24h: 145000, revenue24h: 72000, users24h: 8500, avgApy: 7.8, riskScore: 20, auditStatus: 'audited', chainId: '43114' },

    // BSC
    { id: 'pancakeswap', name: 'PancakeSwap', chain: 'BSC', category: 'DEX', tvl: 2800000000, tvlChange24h: 1.5, tvlChange7d: 5.8, volume24h: 380000000, fees24h: 850000, revenue24h: 425000, users24h: 85000, avgApy: 11.2, riskScore: 28, auditStatus: 'audited', chainId: '56' },
    { id: 'venus', name: 'Venus', chain: 'BSC', category: 'Lending', tvl: 1200000000, tvlChange24h: 0.5, tvlChange7d: 2.2, volume24h: 180000000, fees24h: 420000, revenue24h: 310000, users24h: 15000, avgApy: 4.8, riskScore: 30, auditStatus: 'audited', chainId: '56' },
    { id: 'curve-bsc', name: 'Curve', chain: 'BSC', category: 'DEX', tvl: 280000000, tvlChange24h: 2.2, tvlChange7d: 6.8, volume24h: 120000000, fees24h: 260000, revenue24h: 130000, users24h: 15000, avgApy: 8.5, riskScore: 22, auditStatus: 'audited', chainId: '56' },

    // Solana
    { id: 'raydium', name: 'Raydium', chain: 'Solana', category: 'DEX', tvl: 850000000, tvlChange24h: 3.5, tvlChange7d: 10.2, volume24h: 450000000, fees24h: 980000, revenue24h: 490000, users24h: 35000, avgApy: 14.5, riskScore: 32, auditStatus: 'partially-audited', chainId: 'solana' },
    { id: 'orca', name: 'Orca', chain: 'Solana', category: 'DEX', tvl: 320000000, tvlChange24h: 2.2, tvlChange7d: 7.5, volume24h: 180000000, fees24h: 380000, revenue24h: 190000, users24h: 18000, avgApy: 12.8, riskScore: 30, auditStatus: 'partially-audited', chainId: 'solana' },
    { id: 'marinade', name: 'Marinade', chain: 'Solana', category: 'Liquid Staking', tvl: 580000000, tvlChange24h: 1.8, tvlChange7d: 5.5, volume24h: 28000000, fees24h: 145000, revenue24h: 120000, users24h: 8500, avgApy: 6.2, riskScore: 25, auditStatus: 'audited', chainId: 'solana' },
    { id: 'jpool', name: 'JPool', chain: 'Solana', category: 'Liquid Staking', tvl: 180000000, tvlChange24h: 2.5, tvlChange7d: 8.2, volume24h: 15000000, fees24h: 75000, revenue24h: 62000, users24h: 3500, avgApy: 6.8, riskScore: 28, auditStatus: 'partially-audited', chainId: 'solana' },
  ];

  getOverview(chains?: string): any {
    const chainList = chains ? chains.split(',') : null;
    const filtered = chainList 
      ? this.protocols.filter(p => chainList.includes(p.chainId) || chainList.includes(p.chain))
      : this.protocols;

    const totalTvl = filtered.reduce((sum, p) => sum + p.tvl, 0);
    const totalVolume = filtered.reduce((sum, p) => sum + p.volume24h, 0);
    const totalFees = filtered.reduce((sum, p) => sum + p.fees24h, 0);
    const totalRevenue = filtered.reduce((sum, p) => sum + p.revenue24h, 0);
    const totalUsers = filtered.reduce((sum, p) => sum + p.users24h, 0);
    const avgApy = filtered.reduce((sum, p) => sum + p.avgApy, 0) / filtered.length;
    const avgRiskScore = filtered.reduce((sum, p) => sum + p.riskScore, 0) / filtered.length;

    const chainMetrics: ChainMetrics[] = [];
    const chains_set = new Set(filtered.map(p => p.chain));
    chains_set.forEach(chain => {
      const chainProtocols = filtered.filter(p => p.chain === chain);
      chainMetrics.push({
        chain,
        chainId: chainProtocols[0].chainId,
        totalTvl: chainProtocols.reduce((sum, p) => sum + p.tvl, 0),
        protocolCount: chainProtocols.length,
        topProtocols: chainProtocols.sort((a, b) => b.tvl - a.tvl).slice(0, 5),
      });
    });

    const categoryMetrics: CategoryMetrics[] = [];
    const categories_set = new Set(filtered.map(p => p.category));
    categories_set.forEach(category => {
      const catProtocols = filtered.filter(p => p.category === category);
      categoryMetrics.push({
        category,
        totalTvl: catProtocols.reduce((sum, p) => sum + p.tvl, 0),
        protocolCount: catProtocols.length,
        avgApy: catProtocols.reduce((sum, p) => sum + p.avgApy, 0) / catProtocols.length,
        trend: catProtocols.reduce((sum, p) => sum + p.tvlChange24h, 0) > 0 ? 'up' : 
               catProtocols.reduce((sum, p) => sum + p.tvlChange24h, 0) < 0 ? 'down' : 'stable',
      });
    });

    return {
      totalTvl,
      totalVolume24h: totalVolume,
      totalFees24h: totalFees,
      totalRevenue24h: totalRevenue,
      totalUsers24h: totalUsers,
      avgApy: parseFloat(avgApy.toFixed(2)),
      avgRiskScore: parseFloat(avgRiskScore.toFixed(2)),
      protocolCount: filtered.length,
      chainMetrics: chainMetrics.sort((a, b) => b.totalTvl - a.totalTvl),
      categoryMetrics: categoryMetrics.sort((a, b) => b.totalTvl - a.totalTvl),
    };
  }

  getProtocols(chain?: string, category?: string, sortBy?: string, limit?: number): any {
    let filtered = [...this.protocols];

    if (chain) {
      filtered = filtered.filter(p => p.chain.toLowerCase() === chain.toLowerCase() || p.chainId === chain);
    }

    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    const sortField = sortBy || 'tvl';
    const sortOrder = sortBy?.startsWith('-') ? -1 : 1;
    const field = sortBy?.replace(/^-/, '') || 'tvl';

    filtered.sort((a, b) => {
      const aVal = (a as any)[field];
      const bVal = (b as any)[field];
      return (aVal - bVal) * sortOrder;
    });

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return {
      protocols: filtered,
      total: filtered.length,
      page: 1,
      pageSize: limit || filtered.length,
    };
  }

  getProtocolDetails(id: string): any {
    const protocol = this.protocols.find(p => p.id === id || p.name.toLowerCase().includes(id.toLowerCase()));
    
    if (!protocol) {
      return { error: 'Protocol not found' };
    }

    // Generate historical data
    const historicalData = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variance = (Math.random() - 0.5) * 0.1;
      historicalData.push({
        date: date.toISOString().split('T')[0],
        tvl: protocol.tvl * (1 + variance),
        volume: protocol.volume24h * (1 + variance * 0.5),
        users: Math.floor(protocol.users24h * (1 + variance * 0.3)),
      });
    }

    return {
      ...protocol,
      historicalData,
      chainId: protocol.chainId,
      auditInfo: {
        status: protocol.auditStatus,
        audits: protocol.auditStatus === 'audited' ? ['Trail of Bits', 'OpenZeppelin', 'Certik'] : 
                protocol.auditStatus === 'partially-audited' ? ['OpenZeppelin'] : [],
      },
      riskAssessment: {
        score: protocol.riskScore,
        level: protocol.riskScore < 20 ? 'LOW' : protocol.riskScore < 30 ? 'MEDIUM' : 'HIGH',
        factors: this.getRiskFactors(protocol),
      },
      performance: {
        apy: protocol.avgApy,
        weeklyChange: protocol.tvlChange7d,
        monthlyChange: protocol.tvlChange7d * 4,
      },
    };
  }

  private getRiskFactors(protocol: ProtocolMetric): string[] {
    const factors = [];
    if (protocol.riskScore > 25) factors.push('Higher smart contract risk');
    if (protocol.tvlChange24h < -2) factors.push('Significant TVL outflow');
    if (protocol.auditStatus === 'unaudited') factors.push('Contract not audited');
    if (protocol.auditStatus === 'partially-audited') factors.push('Partial audit coverage');
    if (protocol.category === 'Derivatives') factors.push('Complex financial instruments');
    if (protocol.category === 'Yield Aggregator') factors.push('Strategy risk');
    return factors;
  }

  compareProtocols(protocols: string): any {
    const ids = protocols.split(',');
    const compareData = ids.map(id => this.protocols.find(p => p.id === id || p.name.toLowerCase().includes(id.toLowerCase()))).filter(Boolean);

    if (compareData.length === 0) {
      return { error: 'No protocols found' };
    }

    const metrics = ['tvl', 'volume24h', 'fees24h', 'revenue24h', 'users24h', 'avgApy', 'riskScore'];
    const comparison: any = {};

    metrics.forEach(metric => {
      const values = compareData.map(p => (p as any)[metric]);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      
      comparison[metric] = {
        values: compareData.map(p => ({ id: p.id, name: p.name, value: (p as any)[metric] })),
        max: { id: compareData.find(p => (p as any)[metric] === max)?.id, value: max },
        min: { id: compareData.find(p => (p as any)[metric] === min)?.id, value: min },
        avg: parseFloat(avg.toFixed(2)),
      };
    });

    return {
      protocols: compareData.map(p => ({ id: p.id, name: p.name, chain: p.chain, category: p.category })),
      comparison,
      winner: {
        tvl: compareData.sort((a, b) => b.tvl - a.tvl)[0].id,
        volume: compareData.sort((a, b) => b.volume24h - a.volume24h)[0].id,
        apy: compareData.sort((a, b) => b.avgApy - a.avgApy)[0].id,
        lowestRisk: compareData.sort((a, b) => a.riskScore - b.riskScore)[0].id,
      },
    };
  }

  getTrending(timeRange?: string): any {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    
    const trending = this.protocols
      .map(p => ({
        ...p,
        trendScore: p.tvlChange24h * (days === 7 ? 1 : 0.5) + p.tvlChange7d * (days === 30 ? 0.3 : 0.7),
      }))
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 20);

    return {
      trending: trending.map(p => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        category: p.category,
        tvl: p.tvl,
        tvlChange24h: p.tvlChange24h,
        tvlChange7d: p.tvlChange7d,
        trendScore: parseFloat(p.trendScore.toFixed(2)),
      })),
      timeRange: `${days}d`,
      updatedAt: new Date().toISOString(),
    };
  }

  getCategories(): any {
    const categories = new Map<string, { count: number; totalTvl: number }>();
    
    this.protocols.forEach(p => {
      const existing = categories.get(p.category) || { count: 0, totalTvl: 0 };
      categories.set(p.category, {
        count: existing.count + 1,
        totalTvl: existing.totalTvl + p.tvl,
      });
    });

    return {
      categories: Array.from(categories.entries()).map(([name, data]) => ({
        name,
        protocolCount: data.count,
        totalTvl: data.totalTvl,
      })).sort((a, b) => b.totalTvl - a.totalTvl),
    };
  }

  getChains(): any {
    const chains = new Map<string, { count: number; totalTvl: number; chainId: string }>();
    
    this.protocols.forEach(p => {
      const existing = chains.get(p.chain) || { count: 0, totalTvl: 0, chainId: p.chainId };
      chains.set(p.chain, {
        count: existing.count + 1,
        totalTvl: existing.totalTvl + p.tvl,
        chainId: p.chainId,
      });
    });

    return {
      chains: Array.from(chains.entries()).map(([name, data]) => ({
        name,
        chainId: data.chainId,
        protocolCount: data.count,
        totalTvl: data.totalTvl,
      })).sort((a, b) => b.totalTvl - a.totalTvl),
    };
  }

  searchProtocols(query: string): any {
    const q = query.toLowerCase();
    const results = this.protocols.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.chain.toLowerCase().includes(q) ||
      p.id.includes(q)
    ).slice(0, 10);

    return {
      results: results.map(p => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        category: p.category,
        tvl: p.tvl,
      })),
      total: results.length,
    };
  }
}

import { Injectable } from '@nestjs/common';

interface ProtocolData {
  id: string;
  name: string;
  chain: string;
  category: string;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  users24h: number;
  usersChange24h: number;
  apy: number;
  revenue24h: number;
  fees24h: number;
  marketShare: number;
  rank: number;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  auditStatus: 'audited' | 'partial' | 'unaudited';
  lastUpdated: string;
}

interface ChainData {
  chain: string;
  totalTvl: number;
  protocolCount: number;
  topProtocols: string[];
  avgApy: number;
  totalVolume24h: number;
}

interface CategoryData {
  category: string;
  totalTvl: number;
  protocolCount: number;
  avgApy: number;
  topChains: string[];
  growth: number;
}

@Injectable()
export class CrossChainProtocolAnalyticsService {
  private protocols: ProtocolData[] = [];
  private chains: ChainData[] = [];
  private categories: CategoryData[] = [];
  private initialized = false;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize protocols data
    this.protocols = [
      {
        id: 'uniswap-v3-eth',
        name: 'Uniswap V3',
        chain: 'ethereum',
        category: 'dex',
        tvl: 4500000000,
        tvlChange24h: 2.5,
        volume24h: 1200000000,
        volumeChange24h: 5.2,
        users24h: 85000,
        usersChange24h: 3.1,
        apy: 12.5,
        revenue24h: 3600000,
        fees24h: 4200000,
        marketShare: 8.5,
        rank: 1,
        healthScore: 95,
        riskLevel: 'low',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'aave-v3-eth',
        name: 'Aave V3',
        chain: 'ethereum',
        category: 'lending',
        tvl: 8200000000,
        tvlChange24h: 1.8,
        volume24h: 180000000,
        volumeChange24h: -2.1,
        users24h: 42000,
        usersChange24h: 1.2,
        apy: 4.2,
        revenue24h: 1200000,
        fees24h: 890000,
        marketShare: 15.5,
        rank: 2,
        healthScore: 92,
        riskLevel: 'low',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'curve-eth',
        name: 'Curve Finance',
        chain: 'ethereum',
        category: 'dex',
        tvl: 2100000000,
        tvlChange24h: 3.2,
        volume24h: 450000000,
        volumeChange24h: 8.5,
        users24h: 35000,
        usersChange24h: 2.8,
        apy: 8.7,
        revenue24h: 1800000,
        fees24h: 2100000,
        marketShare: 4.0,
        rank: 3,
        healthScore: 90,
        riskLevel: 'low',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'lido-eth',
        name: 'Lido',
        chain: 'ethereum',
        category: 'staking',
        tvl: 18000000000,
        tvlChange24h: 1.5,
        volume24h: 0,
        volumeChange24h: 0,
        users24h: 280000,
        usersChange24h: 0.8,
        apy: 3.8,
        revenue24h: 8500000,
        fees24h: 9200000,
        marketShare: 34.0,
        rank: 4,
        healthScore: 88,
        riskLevel: 'medium',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'compound-v3-eth',
        name: 'Compound V3',
        chain: 'ethereum',
        category: 'lending',
        tvl: 1200000000,
        tvlChange24h: -0.5,
        volume24h: 85000000,
        volumeChange24h: 1.2,
        users24h: 18000,
        usersChange24h: 0.5,
        apy: 3.5,
        revenue24h: 420000,
        fees24h: 380000,
        marketShare: 2.3,
        rank: 5,
        healthScore: 91,
        riskLevel: 'low',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'yearn-eth',
        name: 'Yearn Finance',
        chain: 'ethereum',
        category: 'yield',
        tvl: 580000000,
        tvlChange24h: 4.2,
        volume24h: 120000000,
        volumeChange24h: 6.8,
        users24h: 12000,
        usersChange24h: 3.5,
        apy: 15.2,
        revenue24h: 680000,
        fees24h: 720000,
        marketShare: 1.1,
        rank: 6,
        healthScore: 85,
        riskLevel: 'medium',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'uniswap-v3-arb',
        name: 'Uniswap V3',
        chain: 'arbitrum',
        category: 'dex',
        tvl: 1800000000,
        tvlChange24h: 5.2,
        volume24h: 650000000,
        volumeChange24h: 12.5,
        users24h: 45000,
        usersChange24h: 8.2,
        apy: 18.5,
        revenue24h: 1950000,
        fees24h: 2300000,
        marketShare: 3.4,
        rank: 7,
        healthScore: 95,
        riskLevel: 'low',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'aave-v3-arb',
        name: 'Aave V3',
        chain: 'arbitrum',
        category: 'lending',
        tvl: 950000000,
        tvlChange24h: 3.8,
        volume24h: 45000000,
        volumeChange24h: 5.2,
        users24h: 12000,
        usersChange24h: 4.5,
        apy: 5.8,
        revenue24h: 280000,
        fees24h: 320000,
        marketShare: 1.8,
        rank: 8,
        healthScore: 92,
        riskLevel: 'low',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'sushiswap-eth',
        name: 'SushiSwap',
        chain: 'ethereum',
        category: 'dex',
        tvl: 380000000,
        tvlChange24h: -1.2,
        volume24h: 95000000,
        volumeChange24h: -3.5,
        users24h: 15000,
        usersChange24h: -2.1,
        apy: 10.2,
        revenue24h: 285000,
        fees24h: 320000,
        marketShare: 0.7,
        rank: 9,
        healthScore: 78,
        riskLevel: 'medium',
        auditStatus: 'partial',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'balancer-eth',
        name: 'Balancer',
        chain: 'ethereum',
        category: 'dex',
        tvl: 420000000,
        tvlChange24h: 2.1,
        volume24h: 78000000,
        volumeChange24h: 4.5,
        users24h: 8500,
        usersChange24h: 1.8,
        apy: 9.8,
        revenue24h: 234000,
        fees24h: 270000,
        marketShare: 0.8,
        rank: 10,
        healthScore: 82,
        riskLevel: 'low',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'lido-poly',
        name: 'Lido',
        chain: 'polygon',
        category: 'staking',
        tvl: 450000000,
        tvlChange24h: 2.8,
        volume24h: 0,
        volumeChange24h: 0,
        users24h: 35000,
        usersChange24h: 1.5,
        apy: 4.2,
        revenue24h: 320000,
        fees24h: 350000,
        marketShare: 0.9,
        rank: 11,
        healthScore: 88,
        riskLevel: 'medium',
        auditStatus: 'audited',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'aerodrome-base',
        name: 'Aerodrome',
        chain: 'base',
        category: 'dex',
        tvl: 280000000,
        tvlChange24h: 15.2,
        volume24h: 180000000,
        volumeChange24h: 22.5,
        users24h: 22000,
        usersChange24h: 18.5,
        apy: 22.5,
        revenue24h: 540000,
        fees24h: 620000,
        marketShare: 0.5,
        rank: 12,
        healthScore: 80,
        riskLevel: 'medium',
        auditStatus: 'partial',
        lastUpdated: new Date().toISOString(),
      },
    ];

    // Initialize chain data
    this.chains = [
      {
        chain: 'ethereum',
        totalTvl: 32500000000,
        protocolCount: 8,
        topProtocols: ['Lido', 'Aave V3', 'Uniswap V3'],
        avgApy: 8.9,
        totalVolume24h: 2180000000,
      },
      {
        chain: 'arbitrum',
        totalTvl: 5200000000,
        protocolCount: 4,
        topProtocols: ['Uniswap V3', 'Aave V3', 'GMX'],
        avgApy: 12.5,
        totalVolume24h: 1200000000,
      },
      {
        chain: 'polygon',
        totalTvl: 1800000000,
        protocolCount: 3,
        topProtocols: ['Lido', 'Aave V3', 'QuickSwap'],
        avgApy: 6.2,
        totalVolume24h: 280000000,
      },
      {
        chain: 'base',
        totalTvl: 850000000,
        protocolCount: 2,
        topProtocols: ['Aerodrome', 'Aave V3'],
        avgApy: 15.8,
        totalVolume24h: 320000000,
      },
      {
        chain: 'optimism',
        totalTvl: 1200000000,
        protocolCount: 3,
        topProtocols: ['Velodrome', 'Aave V3', 'Uniswap V3'],
        avgApy: 11.2,
        totalVolume24h: 450000000,
      },
      {
        chain: 'avalanche',
        totalTvl: 680000000,
        protocolCount: 2,
        topProtocols: ['Trader Joe', 'Benqi'],
        avgApy: 9.5,
        totalVolume24h: 180000000,
      },
    ];

    // Initialize category data
    this.categories = [
      {
        category: 'dex',
        totalTvl: 12800000000,
        protocolCount: 6,
        avgApy: 13.2,
        topChains: ['ethereum', 'arbitrum'],
        growth: 4.5,
      },
      {
        category: 'lending',
        totalTvl: 10500000000,
        protocolCount: 4,
        avgApy: 4.5,
        topChains: ['ethereum', 'arbitrum'],
        growth: 1.8,
      },
      {
        category: 'staking',
        totalTvl: 18500000000,
        protocolCount: 2,
        avgApy: 3.9,
        topChains: ['ethereum', 'polygon'],
        growth: 1.2,
      },
      {
        category: 'yield',
        totalTvl: 850000000,
        protocolCount: 3,
        avgApy: 15.8,
        topChains: ['ethereum'],
        growth: 5.2,
      },
    ];

    this.initialized = true;
  }

  async getOverview() {
    const totalTvl = this.protocols.reduce((sum, p) => sum + p.tvl, 0);
    const totalVolume = this.protocols.reduce((sum, p) => sum + p.volume24h, 0);
    const totalUsers = this.protocols.reduce((sum, p) => sum + p.users24h, 0);
    const totalRevenue = this.protocols.reduce((sum, p) => sum + p.revenue24h, 0);
    const totalFees = this.protocols.reduce((sum, p) => sum + p.fees24h, 0);

    return {
      summary: {
        totalTvl,
        totalVolume24h: totalVolume,
        totalUsers24h: totalUsers,
        totalRevenue24h: totalRevenue,
        totalFees24h: totalFees,
        protocolCount: this.protocols.length,
        chainCount: this.chains.length,
        categoryCount: this.categories.length,
      },
      topChains: this.chains
        .sort((a, b) => b.totalTvl - a.totalTvl)
        .slice(0, 5)
        .map((c) => ({
          chain: c.chain,
          tvl: c.totalTvl,
          protocolCount: c.protocolCount,
        })),
      topCategories: this.categories
        .sort((a, b) => b.totalTvl - a.totalTvl)
        .slice(0, 4)
        .map((c) => ({
          category: c.category,
          tvl: c.totalTvl,
          protocolCount: c.protocolCount,
        })),
      trending: this.protocols
        .sort((a, b) => b.tvlChange24h - a.tvlChange24h)
        .slice(0, 5)
        .map((p) => ({
          name: p.name,
          chain: p.chain,
          change: p.tvlChange24h,
        })),
    };
  }

  async getProtocolList(query: {
    chain?: string;
    category?: string;
    sortBy?: string;
    limit?: number;
  }) {
    let filtered = [...this.protocols];

    if (query.chain) {
      filtered = filtered.filter(
        (p) => p.chain.toLowerCase() === query.chain.toLowerCase(),
      );
    }

    if (query.category) {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === query.category.toLowerCase(),
      );
    }

    const sortField = query.sortBy || 'tvl';
    const sortOrder = ['volume', 'users', 'apy', 'growth'].includes(sortField)
      ? -1
      : 1;

    filtered.sort((a, b) => {
      const aVal = a[sortField as keyof ProtocolData] as number;
      const bVal = b[sortField as keyof ProtocolData] as number;
      return (bVal - aVal) * sortOrder;
    });

    const limit = query.limit || 20;
    return {
      total: filtered.length,
      data: filtered.slice(0, limit),
    };
  }

  async getProtocolDetails(protocolId: string, timeRange?: string) {
    const protocol = this.protocols.find((p) => p.id === protocolId);
    if (!protocol) {
      return { error: 'Protocol not found' };
    }

    // Generate historical data
    const days = timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : timeRange === '1y' ? 365 : 7;
    const historicalData = this.generateHistoricalData(protocol, days);

    return {
      ...protocol,
      historical: historicalData,
      metrics: {
        volatility: Math.random() * 10 + 2,
        sharpeRatio: Math.random() * 2 + 0.5,
        maxDrawdown: Math.random() * 15 + 5,
        avgTransactionSize: Math.random() * 5000 + 1000,
      },
      competitors: this.protocols
        .filter((p) => p.category === protocol.category && p.id !== protocolId)
        .slice(0, 3),
    };
  }

  private generateHistoricalData(protocol: ProtocolData, days: number) {
    const data = [];
    const baseValue = protocol.tvl;
    let currentValue = baseValue;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.48) * 0.05 * currentValue;
      currentValue = Math.max(currentValue + change, currentValue * 0.9);

      data.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.round(currentValue),
        volume: Math.round(protocol.volume24h * (0.8 + Math.random() * 0.4)),
        users: Math.round(protocol.users24h * (0.85 + Math.random() * 0.3)),
      });
    }

    return data;
  }

  async compareProtocols(protocolIds: string[]) {
    const protocols = this.protocols.filter((p) => protocolIds.includes(p.id));

    if (protocols.length < 2) {
      return { error: 'At least 2 protocols required for comparison' };
    }

    const comparison = {
      tvl: protocols.map((p) => ({ name: p.name, value: p.tvl, change: p.tvlChange24h })),
      volume: protocols.map((p) => ({ name: p.name, value: p.volume24h, change: p.volumeChange24h })),
      users: protocols.map((p) => ({ name: p.name, value: p.users24h, change: p.usersChange24h })),
      apy: protocols.map((p) => ({ name: p.name, value: p.apy })),
      revenue: protocols.map((p) => ({ name: p.name, value: p.revenue24h })),
      healthScore: protocols.map((p) => ({ name: p.name, value: p.healthScore })),
      riskLevel: protocols.map((p) => ({ name: p.name, value: p.riskLevel })),
    };

    const winner: Record<string, string> = {};
    if (protocols[0].tvl > protocols[1].tvl) winner.tvl = protocols[0].name;
    if (protocols[0].volume24h > protocols[1].volume24h) winner.volume = protocols[0].name;
    if (protocols[0].apy > protocols[1].apy) winner.apy = protocols[0].name;
    if (protocols[0].healthScore > protocols[1].healthScore) winner.health = protocols[0].name;

    return { comparison, winner };
  }

  async getTrendingProtocols(metric?: string) {
    const field = metric === 'volume' ? 'volumeChange24h' 
      : metric === 'users' ? 'usersChange24h' 
      : 'tvlChange24h';

    return this.protocols
      .sort((a, b) => (b[field as keyof ProtocolData] as number) - (a[field as keyof ProtocolData] as number))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        category: p.category,
        change: p[field as keyof ProtocolData],
        tvl: p.tvl,
      }));
  }

  async getCategorySummary() {
    return this.categories.map((c) => ({
      ...c,
      avgApy: Math.round(c.avgApy * 100) / 100,
      growth: Math.round(c.growth * 100) / 100,
    }));
  }

  async getChainAnalysis() {
    return this.chains.map((c) => ({
      ...c,
      marketShare: Math.round((c.totalTvl / this.protocols.reduce((s, p) => s + p.tvl, 0)) * 10000) / 100,
    }));
  }

  async getPerformanceMetrics(timeRange?: string) {
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
    
    return this.protocols.map((p) => ({
      id: p.id,
      name: p.name,
      chain: p.chain,
      category: p.category,
      performance: {
        tvlReturn: (Math.random() * 20 - 5).toFixed(2),
        volumeReturn: (Math.random() * 30 - 10).toFixed(2),
        userGrowth: (Math.random() * 15 - 2).toFixed(2),
        revenueGrowth: (Math.random() * 25 - 5).toFixed(2),
      },
      risk: {
        volatility: (Math.random() * 10 + 2).toFixed(2),
        drawdown: (Math.random() * 15 + 5).toFixed(2),
      },
      efficiency: {
        revenuePerTvl: (p.revenue24h / p.tvl * 365 * 100).toFixed(2),
        volumePerTvl: (p.volume24h / p.tvl * 365 * 100).toFixed(2),
      },
    }));
  }

  async getRiskAssessment() {
    return this.protocols.map((p) => ({
      id: p.id,
      name: p.name,
      chain: p.chain,
      category: p.category,
      riskLevel: p.riskLevel,
      healthScore: p.healthScore,
      auditStatus: p.auditStatus,
      factors: {
        smartContractRisk: p.riskLevel === 'low' ? 'Low' : p.riskLevel === 'medium' ? 'Medium' : 'High',
        liquidityRisk: p.tvlChange24h < 0 ? 'Medium' : 'Low',
        marketRisk: (p.volume24h / p.tvl) < 0.01 ? 'Medium' : 'Low',
        governanceRisk: p.auditStatus === 'audited' ? 'Low' : 'Medium',
      },
      recommendations: this.getRiskRecommendations(p),
    }));
  }

  private getRiskRecommendations(protocol: ProtocolData): string[] {
    const recommendations = [];
    
    if (protocol.healthScore < 85) {
      recommendations.push('Consider reviewing protocol audits');
    }
    if (protocol.tvlChange24h < 0) {
      recommendations.push('Monitor TVL trends closely');
    }
    if (protocol.riskLevel === 'high' || protocol.riskLevel === 'critical') {
      recommendations.push('Exercise caution with large deposits');
    }
    if (protocol.auditStatus !== 'audited') {
      recommendations.push('Protocol may benefit from additional security audits');
    }
    
    return recommendations;
  }

  async findYieldOpportunities() {
    const yieldOpportunities = this.protocols
      .filter((p) => p.apy > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        category: p.category,
        apy: p.apy,
        tvl: p.tvl,
        riskLevel: p.riskLevel,
        roi: this.calculateROI(p),
      }))
      .sort((a, b) => b.roi - a.roi);

    return {
      opportunities: yieldOpportunities.slice(0, 10),
      bestPerChain: yieldOpportunities.filter(p => p.chain === 'ethereum').slice(0, 3),
      bestPerCategory: {
        dex: yieldOpportunities.filter(p => p.category === 'dex').slice(0, 3),
        lending: yieldOpportunities.filter(p => p.category === 'lending').slice(0, 3),
        yield: yieldOpportunities.filter(p => p.category === 'yield').slice(0, 3),
      },
    };
  }

  private calculateROI(protocol: ProtocolData): number {
    const riskMultiplier = protocol.riskLevel === 'low' ? 1.0 
      : protocol.riskLevel === 'medium' ? 0.85 
      : 0.6;
    return protocol.apy * riskMultiplier * (protocol.tvl / 1000000000);
  }

  async searchProtocols(query: string) {
    const q = query.toLowerCase();
    return this.protocols
      .filter((p) => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.chain.toLowerCase().includes(q)
      )
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        category: p.category,
      }));
  }

  async getLeaderboard(type: string, limit?: number) {
    const field = type === 'volume' ? 'volume24h' 
      : type === 'users' ? 'users24h' 
      : type === 'growth' ? 'tvlChange24h' 
      : 'tvl';

    return this.protocols
      .sort((a, b) => (b[field as keyof ProtocolData] as number) - (a[field as keyof ProtocolData] as number))
      .slice(0, limit || 20)
      .map((p, index) => ({
        rank: index + 1,
        id: p.id,
        name: p.name,
        chain: p.chain,
        category: p.category,
        value: p[field as keyof ProtocolData],
        change: p.tvlChange24h,
      }));
  }

  async getHealthScores() {
    return this.protocols.map((p) => ({
      id: p.id,
      name: p.name,
      chain: p.chain,
      healthScore: p.healthScore,
      riskLevel: p.riskLevel,
      grade: this.getGrade(p.healthScore),
    }));
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  async getHistoricalTrends(protocolId?: string, timeRange?: string) {
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
    
    if (protocolId) {
      const protocol = this.protocols.find((p) => p.id === protocolId);
      if (!protocol) return { error: 'Protocol not found' };
      return this.generateHistoricalData(protocol, days);
    }

    // Aggregate all protocols
    const aggregated = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      aggregated.push({
        date: date.toISOString().split('T')[0],
        totalTvl: this.protocols.reduce((sum, p) => sum + p.tvl * (0.95 + Math.random() * 0.1), 0),
        totalVolume: this.protocols.reduce((sum, p) => sum + p.volume24h * (0.8 + Math.random() * 0.4), 0),
        totalUsers: this.protocols.reduce((sum, p) => sum + p.users24h * (0.85 + Math.random() * 0.3), 0),
      });
    }

    return aggregated;
  }
}

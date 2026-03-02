import { Injectable } from '@nestjs/common';

interface Protocol {
  id: string;
  name: string;
  symbol: string;
  category: string;
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  volume24h: number;
  revenue24h: number;
  logoUrl: string;
}

interface ProtocolHistory {
  date: string;
  tvl: number;
  volume: number;
}

@Injectable()
export class DefiTvlService {
  private protocols: Protocol[] = [
    {
      id: 'uniswap-v3',
      name: 'Uniswap V3',
      symbol: 'UNI',
      category: 'DEX',
      chain: 'Ethereum',
      tvl: 3500000000,
      tvlChange24h: 2.5,
      tvlChange7d: 5.8,
      volume24h: 1200000000,
      revenue24h: 3500000,
      logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    },
    {
      id: 'aave-v3',
      name: 'Aave V3',
      symbol: 'AAVE',
      category: 'Lending',
      chain: 'Ethereum',
      tvl: 12000000000,
      tvlChange24h: 1.2,
      tvlChange7d: 3.4,
      volume24h: 180000000,
      revenue24h: 2100000,
      logoUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    },
    {
      id: 'curve',
      name: 'Curve Finance',
      symbol: 'CRV',
      category: 'DEX',
      chain: 'Ethereum',
      tvl: 2100000000,
      tvlChange24h: -0.8,
      tvlChange7d: 2.1,
      volume24h: 450000000,
      revenue24h: 890000,
      logoUrl: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
    },
    {
      id: 'compound',
      name: 'Compound',
      symbol: 'COMP',
      category: 'Lending',
      chain: 'Ethereum',
      tvl: 900000000,
      tvlChange24h: 0.5,
      tvlChange7d: 1.8,
      volume24h: 85000000,
      revenue24h: 420000,
      logoUrl: 'https://cryptologos.cc/logos/compound-comp-logo.png',
    },
    {
      id: 'lido',
      name: 'Lido',
      symbol: 'LDO',
      category: 'Staking',
      chain: 'Ethereum',
      tvl: 18000000000,
      tvlChange24h: 3.2,
      tvlChange7d: 8.5,
      volume24h: 25000000,
      revenue24h: 5200000,
      logoUrl: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      symbol: 'MKR',
      category: 'Lending',
      chain: 'Ethereum',
      tvl: 6500000000,
      tvlChange24h: 1.5,
      tvlChange7d: 4.2,
      volume24h: 120000000,
      revenue24h: 1800000,
      logoUrl: 'https://cryptologos.cc/logos/maker-mkr-logo.png',
    },
    {
      id: 'sushiswap',
      name: 'SushiSwap',
      symbol: 'SUSHI',
      category: 'DEX',
      chain: 'Ethereum',
      tvl: 380000000,
      tvlChange24h: -1.2,
      tvlChange7d: -2.5,
      volume24h: 95000000,
      revenue24h: 180000,
      logoUrl: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
    },
    {
      id: 'yearn',
      name: 'Yearn Finance',
      symbol: 'YFI',
      category: 'Yield',
      chain: 'Ethereum',
      tvl: 520000000,
      tvlChange24h: 0.9,
      tvlChange7d: 2.8,
      volume24h: 45000000,
      revenue24h: 320000,
      logoUrl: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png',
    },
    {
      id: 'balancer',
      name: 'Balancer',
      symbol: 'BAL',
      category: 'DEX',
      chain: 'Ethereum',
      tvl: 280000000,
      tvlChange24h: 1.8,
      tvlChange7d: 4.5,
      volume24h: 65000000,
      revenue24h: 150000,
      logoUrl: 'https://cryptologos.cc/logos/balancer-bal-logo.png',
    },
    {
      id: '1inch',
      name: '1inch',
      symbol: '1INCH',
      category: 'Aggregator',
      chain: 'Ethereum',
      tvl: 180000000,
      tvlChange24h: 0.3,
      tvlChange7d: 1.2,
      volume24h: 180000000,
      revenue24h: 210000,
      logoUrl: 'https://cryptologos.cc/logos/1inch-1inch-logo.png',
    },
  ];

  private categories = [
    { id: 'dex', name: 'DEX', tvl: 6100000000, count: 4 },
    { id: 'lending', name: 'Lending', tvl: 19500000000, count: 3 },
    { id: 'staking', name: 'Staking', tvl: 18000000000, count: 1 },
    { id: 'yield', name: 'Yield', tvl: 520000000, count: 1 },
    { id: 'aggregator', name: 'Aggregator', tvl: 180000000, count: 1 },
  ];

  getProtocols() {
    return this.protocols.sort((a, b) => b.tvl - a.tvl);
  }

  getOverview() {
    const totalTvl = this.protocols.reduce((sum, p) => sum + p.tvl, 0);
    const avgChange24h =
      this.protocols.reduce((sum, p) => sum + p.tvlChange24h, 0) /
      this.protocols.length;
    const avgChange7d =
      this.protocols.reduce((sum, p) => sum + p.tvlChange7d, 0) /
      this.protocols.length;
    const totalVolume24h = this.protocols.reduce(
      (sum, p) => sum + p.volume24h,
      0,
    );
    const totalRevenue24h = this.protocols.reduce(
      (sum, p) => sum + p.revenue24h,
      0,
    );

    return {
      totalTvl,
      totalTvlFormatted: this.formatTvl(totalTvl),
      avgChange24h: avgChange24h.toFixed(2),
      avgChange7d: avgChange7d.toFixed(2),
      totalVolume24h,
      totalVolume24hFormatted: this.formatTvl(totalVolume24h),
      totalRevenue24h,
      totalRevenue24hFormatted: this.formatTvl(totalRevenue24h),
      protocolCount: this.protocols.length,
      categories: this.categories,
    };
  }

  getProtocolHistory(protocol: string, days: number): ProtocolHistory[] {
    const protocolData = this.protocols.find((p) => p.id === protocol);
    if (!protocolData) {
      return [];
    }

    const history: ProtocolHistory[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate realistic-looking historical data with some variance
      const variance = 0.1; // 10% variance
      const randomFactor = 1 + (Math.random() - 0.5) * variance;
      const trendFactor = 1 + (days - i) * 0.002; // Slight upward trend

      history.push({
        date: date.toISOString().split('T')[0],
        tvl: Math.round(
          (protocolData.tvl * randomFactor * trendFactor) / (1 + variance / 2),
        ),
        volume: Math.round(
          (protocolData.volume24h * randomFactor) / (1 + variance / 2),
        ),
      });
    }

    return history;
  }

  compareProtocols(protocols: string[]) {
    return this.protocols
      .filter((p) => protocols.includes(p.id))
      .sort((a, b) => b.tvl - a.tvl);
  }

  getTrending(days: number) {
    return [...this.protocols]
      .sort((a, b) => b.tvlChange7d - a.tvlChange7d)
      .slice(0, 5);
  }

  getCategories() {
    return this.categories;
  }

  private formatTvl(value: number): string {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  }
}

import { Injectable } from '@nestjs/common';

interface YieldPool {
  id: string;
  name: string;
  protocol: string;
  chain: string;
  token0: string;
  token1: string;
  apy: number;
  apy24h: number;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  rewardToken: string;
  risk: 'low' | 'medium' | 'high';
  lockPeriod: number;
  poolAddress: string;
  url: string;
}

interface Portfolio {
  address: string;
  pools: {
    poolAddress: string;
    poolName: string;
    deposited: number;
    currentValue: number;
    pendingRewards: number;
    apy: number;
  }[];
  totalValue: number;
  totalRewards: number;
}

@Injectable()
export class YieldFarmingService {
  private readonly mockPools: YieldPool[] = [
    {
      id: '1',
      name: 'USDC-USDT',
      protocol: 'Uniswap V3',
      chain: 'Ethereum',
      token0: 'USDC',
      token1: 'USDT',
      apy: 12.5,
      apy24h: 11.8,
      tvl: 125000000,
      tvlChange24h: 2.3,
      volume24h: 45000000,
      rewardToken: 'UNI',
      risk: 'low',
      lockPeriod: 0,
      poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
      url: 'https://uniswap.org',
    },
    {
      id: '2',
      name: 'ETH-USDC',
      protocol: 'Uniswap V3',
      chain: 'Ethereum',
      token0: 'WETH',
      token1: 'USDC',
      apy: 18.2,
      apy24h: 17.5,
      tvl: 89000000,
      tvlChange24h: -1.2,
      volume24h: 32000000,
      rewardToken: 'UNI',
      risk: 'medium',
      lockPeriod: 0,
      poolAddress: '0x4e68Ccc3E7D1D2f0c4f6cD8a4f5e9a2B3d1C8E7F',
      url: 'https://uniswap.org',
    },
    {
      id: '3',
      name: 'WBTC-ETH',
      protocol: 'Curve',
      chain: 'Ethereum',
      token0: 'WBTC',
      token1: 'WETH',
      apy: 8.5,
      apy24h: 8.2,
      tvl: 210000000,
      tvlChange24h: 0.8,
      volume24h: 18000000,
      rewardToken: 'CRV',
      risk: 'low',
      lockPeriod: 0,
      poolAddress: '0xD51a44d3FaE010294C61688bB2cd12bA3eB19f64',
      url: 'https://curve.fi',
    },
    {
      id: '4',
      name: 'stETH-ETH',
      protocol: 'Curve',
      chain: 'Ethereum',
      token0: 'stETH',
      token1: 'WETH',
      apy: 5.2,
      apy24h: 5.5,
      tvl: 320000000,
      tvlChange24h: 3.5,
      volume24h: 8500000,
      rewardToken: 'CRV',
      risk: 'low',
      lockPeriod: 0,
      poolAddress: '0xDC24316b9AE028F1497c275EB919AC3dCc74F4E9',
      url: 'https://curve.fi',
    },
    {
      id: '5',
      name: 'USDC-USDT',
      protocol: 'SushiSwap',
      chain: 'Arbitrum',
      token0: 'USDC',
      token1: 'USDT',
      apy: 15.8,
      apy24h: 14.2,
      tvl: 45000000,
      tvlChange24h: 5.2,
      volume24h: 22000000,
      rewardToken: 'SUSHI',
      risk: 'low',
      lockPeriod: 0,
      poolAddress: '0x0E9Ed9f3dD0a4F5a3eF5c5c8c8D7E9F1a2B3C4D5',
      url: 'https://sushi.com',
    },
    {
      id: '6',
      name: 'ARB-ETH',
      protocol: 'SushiSwap',
      chain: 'Arbitrum',
      token0: 'ARB',
      token1: 'WETH',
      apy: 28.5,
      apy24h: 25.0,
      tvl: 28000000,
      tvlChange24h: 8.5,
      volume24h: 15000000,
      rewardToken: 'SUSHI',
      risk: 'high',
      lockPeriod: 0,
      poolAddress: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
      url: 'https://sushi.com',
    },
    {
      id: '7',
      name: 'MATIC-USDC',
      protocol: 'QuickSwap',
      chain: 'Polygon',
      token0: 'MATIC',
      token1: 'USDC',
      apy: 22.3,
      apy24h: 20.1,
      tvl: 35000000,
      tvlChange24h: -2.1,
      volume24h: 18000000,
      rewardToken: 'QUICK',
      risk: 'medium',
      lockPeriod: 0,
      poolAddress: '0x2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C',
      url: 'https://quickswap.exchange',
    },
    {
      id: '8',
      name: 'AAVE-USDC',
      protocol: 'Uniswap V3',
      chain: 'Ethereum',
      token0: 'AAVE',
      token1: 'USDC',
      apy: 14.8,
      apy24h: 13.5,
      tvl: 42000000,
      tvlChange24h: 1.5,
      volume24h: 12000000,
      rewardToken: 'UNI',
      risk: 'medium',
      lockPeriod: 0,
      poolAddress: '0x3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D',
      url: 'https://uniswap.org',
    },
    {
      id: '9',
      name: 'LDO-ETH',
      protocol: 'Curve',
      chain: 'Ethereum',
      token0: 'LDO',
      token1: 'WETH',
      apy: 9.8,
      apy24h: 10.2,
      tvl: 85000000,
      tvlChange24h: 4.2,
      volume24h: 9500000,
      rewardToken: 'CRV',
      risk: 'medium',
      lockPeriod: 0,
      poolAddress: '0x4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E',
      url: 'https://curve.fi',
    },
    {
      id: '10',
      name: 'OP-ETH',
      protocol: 'Velodrome',
      chain: 'Optimism',
      token0: 'OP',
      token1: 'WETH',
      apy: 25.5,
      apy24h: 22.8,
      tvl: 52000000,
      tvlChange24h: 6.8,
      volume24h: 25000000,
      rewardToken: 'VELO',
      risk: 'high',
      lockPeriod: 0,
      poolAddress: '0x5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F',
      url: 'https://velodrome.finance',
    },
  ];

  async getYieldPools(chain?: string, sortBy?: string): Promise<YieldPool[]> {
    let pools = [...this.mockPools];
    
    if (chain) {
      pools = pools.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
    }
    
    if (sortBy) {
      switch (sortBy) {
        case 'apy':
          pools.sort((a, b) => b.apy - a.apy);
          break;
        case 'tvl':
          pools.sort((a, b) => b.tvl - a.tvl);
          break;
        case 'volume':
          pools.sort((a, b) => b.volume24h - a.volume24h);
          break;
        case 'tvlChange':
          pools.sort((a, b) => b.tvlChange24h - a.tvlChange24h);
          break;
      }
    }
    
    return pools;
  }

  async getPoolDetails(poolAddress: string): Promise<YieldPool | null> {
    return this.mockPools.find(p => p.poolAddress === poolAddress) || null;
  }

  async getPortfolio(address: string): Promise<Portfolio> {
    // Simulated portfolio data
    const mockPortfolio: Portfolio = {
      address,
      pools: [
        {
          poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
          poolName: 'USDC-USDT (Uniswap V3)',
          deposited: 10000,
          currentValue: 10580,
          pendingRewards: 45.5,
          apy: 12.5,
        },
        {
          poolAddress: '0xD51a44d3FaE010294C61688bB2cd12bA3eB19f64',
          poolName: 'WBTC-ETH (Curve)',
          deposited: 15000,
          currentValue: 15820,
          pendingRewards: 12.8,
          apy: 8.5,
        },
      ],
      totalValue: 26400,
      totalRewards: 58.3,
    };
    
    return mockPortfolio;
  }

  async getYieldFarmingStats() {
    const totalTvl = this.mockPools.reduce((sum, p) => sum + p.tvl, 0);
    const avgApy = this.mockPools.reduce((sum, p) => sum + p.apy, 0) / this.mockPools.length;
    const chains = [...new Set(this.mockPools.map(p => p.chain))];
    const protocols = [...new Set(this.mockPools.map(p => p.protocol))];
    
    return {
      totalTvl,
      totalPools: this.mockPools.length,
      avgApy: avgApy.toFixed(2),
      chains: chains.length,
      protocols: protocols.length,
      topChain: this.getTopChain(),
      topProtocol: this.getTopProtocol(),
      tvlByChain: this.getTvlByChain(),
      apyDistribution: this.getApyDistribution(),
    };
  }

  private getTopChain(): { name: string; tvl: number } {
    const chainTvl = new Map<string, number>();
    this.mockPools.forEach(p => {
      chainTvl.set(p.chain, (chainTvl.get(p.chain) || 0) + p.tvl);
    });
    const sorted = Array.from(chainTvl.entries())
      .sort((a, b) => b[1] - a[1])[0];
    return { name: sorted[0], tvl: sorted[1] };
  }

  private getTopProtocol(): { name: string; tvl: number } {
    const protocolTvl = new Map<string, number>();
    this.mockPools.forEach(p => {
      protocolTvl.set(p.protocol, (protocolTvl.get(p.protocol) || 0) + p.tvl);
    });
    const sorted = Array.from(protocolTvl.entries())
      .sort((a, b) => b[1] - a[1])[0];
    return { name: sorted[0], tvl: sorted[1] };
  }

  private getTvlByChain(): { name: string; tvl: number }[] {
    const chainTvl = new Map<string, number>();
    this.mockPools.forEach(p => {
      chainTvl.set(p.chain, (chainTvl.get(p.chain) || 0) + p.tvl);
    });
    return Array.from(chainTvl.entries())
      .map(([name, tvl]) => ({ name, tvl }))
      .sort((a, b) => b.tvl - a.tvl);
  }

  private getApyDistribution(): { range: string; count: number }[] {
    const ranges = [
      { range: '0-5%', min: 0, max: 5 },
      { range: '5-10%', min: 5, max: 10 },
      { range: '10-15%', min: 10, max: 15 },
      { range: '15-20%', min: 15, max: 20 },
      { range: '20%+', min: 20, max: 100 },
    ];
    
    return ranges.map(r => ({
      range: r.range,
      count: this.mockPools.filter(p => p.apy >= r.min && p.apy < r.max).length,
    }));
  }

  async getTrendingPools(): Promise<YieldPool[]> {
    return [...this.mockPools]
      .sort((a, b) => b.tvlChange24h - a.tvlChange24h)
      .slice(0, 5);
  }

  async trackPortfolio(address: string, pools: string[]): Promise<{ success: boolean }> {
    // In production, this would save to database
    return { success: true };
  }

  async calculateYield(
    principal: number,
    apy: number,
    days: number,
    compoundFrequency: string,
  ): Promise<{
    principal: number;
    apy: number;
    days: number;
    compoundFrequency: string;
    finalAmount: number;
    totalYield: number;
    yieldPercentage: number;
    breakdown: { day: number; amount: number; yield: number }[];
  }> {
    const compoundingPerYear: Record<string, number> = {
      daily: 365,
      weekly: 52,
      monthly: 12,
      yearly: 1,
    };
    
    const n = compoundingPerYear[compoundFrequency] || 365;
    const rate = apy / 100;
    const t = days / 365;
    
    const finalAmount = principal * Math.pow(1 + rate / n, n * t);
    const totalYield = finalAmount - principal;
    const yieldPercentage = (totalYield / principal) * 100;
    
    const breakdown: { day: number; amount: number; yield: number }[] = [];
    for (let i = 1; i <= days; i++) {
      const dayAmount = principal * Math.pow(1 + rate / n, n * (i / 365));
      breakdown.push({
        day: i,
        amount: dayAmount,
        yield: dayAmount - principal,
      });
    }
    
    return {
      principal,
      apy,
      days,
      compoundFrequency,
      finalAmount,
      totalYield,
      yieldPercentage,
      breakdown,
    };
  }

  async findOpportunities(
    minApy?: number,
    maxRisk?: string,
  ): Promise<YieldPool[]> {
    let pools = [...this.mockPools];
    
    if (minApy !== undefined) {
      pools = pools.filter(p => p.apy >= minApy);
    }
    
    if (maxRisk) {
      const riskLevels = ['low', 'medium', 'high'];
      const maxRiskIndex = riskLevels.indexOf(maxRisk);
      if (maxRiskIndex >= 0) {
        pools = pools.filter(p => riskLevels.indexOf(p.risk) <= maxRiskIndex);
      }
    }
    
    return pools.sort((a, b) => b.apy - a.apy).slice(0, 10);
  }
}

import { Injectable } from '@nestjs/common';

export interface LiquidityMiningPool {
  id: string;
  name: string;
  protocol: string;
  chain: string;
  pair: string;
  token0: string;
  token1: string;
  tvl: number;
  apy: number;
  rewardToken: string;
  rewardTokenPrice: number;
  dailyReward: number;
  volume24h: number;
  fees24h: number;
  lockPeriod: number; // days
  riskLevel: 'low' | 'medium' | 'high';
  poolAddress: string;
  dex: string;
  categories: string[];
}

export interface MiningStats {
  totalPools: number;
  totalValueLocked: number;
  averageApy: number;
  topPerformer: LiquidityMiningPool;
  chainDistribution: Record<string, number>;
  protocolDistribution: Record<string, number>;
}

export interface PoolComparison {
  pool1: LiquidityMiningPool;
  pool2: LiquidityMiningPool;
  apyDifference: number;
  tvlDifference: number;
  riskComparison: string;
  recommendation: string;
}

@Injectable()
export class LiquidityMiningAnalyticsService {
  private readonly supportedChains = [
    'Ethereum',
    'Polygon',
    'Arbitrum',
    'Optimism',
    'BSC',
    'Base',
    'Avalanche',
  ];

  private readonly supportedProtocols = [
    'Uniswap V3',
    'Uniswap V2',
    'SushiSwap',
    'Curve',
    'Balancer',
    'PancakeSwap',
    'QuickSwap',
    'GMX',
    'Aerodrome',
    'Velodrome',
    'Trader Joe',
    'Raydium',
    'Orca',
  ];

  private generateMockPools(): LiquidityMiningPool[] {
    const pools: LiquidityMiningPool[] = [];
    const pairs = [
      { token0: 'ETH', token1: 'USDC', pair: 'ETH/USDC' },
      { token0: 'WBTC', token1: 'ETH', pair: 'WBTC/ETH' },
      { token0: 'USDT', token1: 'USDC', pair: 'USDT/USDC' },
      { token0: 'ETH', token1: 'DAI', pair: 'ETH/DAI' },
      { token0: 'SOL', token1: 'USDC', pair: 'SOL/USDC' },
      { token0: 'AAVE', token1: 'ETH', pair: 'AAVE/ETH' },
      { token0: 'UNI', token1: 'ETH', pair: 'UNI/ETH' },
      { token0: 'LINK', token1: 'ETH', pair: 'LINK/ETH' },
      { token0: 'MATIC', token1: 'USDC', pair: 'MATIC/USDC' },
      { token0: 'ARB', token1: 'ETH', pair: 'ARB/ETH' },
    ];

    let poolId = 1;
    this.supportedChains.forEach((chain) => {
      this.supportedProtocols.forEach((protocol) => {
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const baseApy = chain === 'Ethereum' ? 15 : chain === 'Avalanche' ? 25 : 20;
        const tvl = Math.random() * 500000000 + 1000000;
        
        pools.push({
          id: `pool-${poolId++}`,
          name: `${pair.pair} ${protocol}`,
          protocol,
          chain,
          pair: pair.pair,
          token0: pair.token0,
          token1: pair.token1,
          tvl: Math.round(tvl),
          apy: Math.round((baseApy + Math.random() * 30) * 100) / 100,
          rewardToken: pair.token0,
          rewardTokenPrice: Math.random() * 3000 + 10,
          dailyReward: Math.random() * 50000 + 1000,
          volume24h: Math.random() * 100000000 + 1000000,
          fees24h: Math.random() * 500000 + 10000,
          lockPeriod: protocol.includes('V3') ? 0 : Math.floor(Math.random() * 30),
          riskLevel: this.getRiskLevel(tvl, baseApy),
          poolAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          dex: protocol,
          categories: this.getCategories(protocol),
        });
      });
    });

    return pools;
  }

  private getRiskLevel(tvl: number, apy: number): 'low' | 'medium' | 'high' {
    if (tvl > 100000000 && apy < 20) return 'low';
    if (tvl > 10000000 && apy < 40) return 'medium';
    return 'high';
  }

  private getCategories(protocol: string): string[] {
    const categories: Record<string, string[]> = {
      'Uniswap V3': ['DEX', 'Concentrated Liquidity'],
      'Uniswap V2': ['DEX', 'AMM'],
      SushiSwap: ['DEX', 'AMM'],
      Curve: ['Stablecoin DEX', 'Stablecoin'],
      Balancer: ['DEX', 'AMM'],
      PancakeSwap: ['DEX', 'AMM'],
      QuickSwap: ['DEX', 'AMM'],
      GMX: ['Perpetuals', 'DEX'],
      Aerodrome: ['DEX', 'Concentrated Liquidity'],
      Velodrome: ['DEX', 'Concentrated Liquidity'],
      'Trader Joe': ['DEX', 'AMM'],
      Raydium: ['DEX', 'AMM'],
      Orca: ['DEX', 'AMM'],
    };
    return categories[protocol] || ['DEX'];
  }

  async getPools(filters?: {
    chain?: string;
    protocol?: string;
    minApy?: number;
    minTvl?: number;
    riskLevel?: string;
  }): Promise<LiquidityMiningPool[]> {
    let pools = this.generateMockPools();

    if (filters?.chain) {
      pools = pools.filter((p) => p.chain.toLowerCase() === filters.chain!.toLowerCase());
    }
    if (filters?.protocol) {
      pools = pools.filter((p) => p.protocol.toLowerCase() === filters.protocol!.toLowerCase());
    }
    if (filters?.minApy) {
      pools = pools.filter((p) => p.apy >= filters.minApy!);
    }
    if (filters?.minTvl) {
      pools = pools.filter((p) => p.tvl >= filters.minTvl!);
    }
    if (filters?.riskLevel) {
      pools = pools.filter((p) => p.riskLevel === filters.riskLevel);
    }

    return pools.sort((a, b) => b.apy - a.apy);
  }

  async getPoolById(id: string): Promise<LiquidityMiningPool | null> {
    const pools = this.generateMockPools();
    return pools.find((p) => p.id === id) || null;
  }

  async getStats(): Promise<MiningStats> {
    const pools = this.generateMockPools();
    
    const chainDistribution: Record<string, number> = {};
    const protocolDistribution: Record<string, number> = {};
    let totalTvl = 0;

    pools.forEach((pool) => {
      totalTvl += pool.tvl;
      chainDistribution[pool.chain] = (chainDistribution[pool.chain] || 0) + pool.tvl;
      protocolDistribution[pool.protocol] = (protocolDistribution[pool.protocol] || 0) + pool.tvl;
    });

    const topPerformer = pools.reduce((max, pool) => 
      pool.apy > max.apy ? pool : max, pools[0]);

    return {
      totalPools: pools.length,
      totalValueLocked: Math.round(totalTvl),
      averageApy: Math.round((pools.reduce((sum, p) => sum + p.apy, 0) / pools.length) * 100) / 100,
      topPerformer,
      chainDistribution,
      protocolDistribution,
    };
  }

  async comparePools(pool1Id: string, pool2Id: string): Promise<PoolComparison | null> {
    const pool1 = await this.getPoolById(pool1Id);
    const pool2 = await this.getPoolById(pool2Id);

    if (!pool1 || !pool2) return null;

    const apyDifference = Math.round((pool1.apy - pool2.apy) * 100) / 100;
    const tvlDifference = Math.round(pool1.tvl - pool2.tvl);
    
    const riskComparison = pool1.riskLevel === pool2.riskLevel 
      ? 'Same risk level' 
      : `${pool1.riskLevel} vs ${pool2.riskLevel}`;

    let recommendation = '';
    if (pool1.apy > pool2.apy && pool1.riskLevel !== 'high') {
      recommendation = `Pool 1 (${pool1.name}) offers higher APY with ${pool1.riskLevel} risk`;
    } else if (pool2.apy > pool1.apy && pool2.riskLevel !== 'high') {
      recommendation = `Pool 2 (${pool2.name}) offers higher APY with ${pool2.riskLevel} risk`;
    } else {
      recommendation = 'Both pools have similar risk-adjusted returns. Consider TVL and liquidity.';
    }

    return {
      pool1,
      pool2,
      apyDifference,
      tvlDifference,
      riskComparison,
      recommendation,
    };
  }

  async calculateROI(
    principal: number,
    apy: number,
    days: number,
    compoundFrequency: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<{
    finalAmount: number;
    profit: number;
    effectiveApy: number;
    breakdown: { day: number; amount: number }[];
  }> {
    const freqMap = { daily: 365, weekly: 52, monthly: 12 };
    const n = freqMap[compoundFrequency];
    const rate = apy / 100;
    
    const finalAmount = principal * Math.pow(1 + rate / n, n * (days / 365));
    const profit = finalAmount - principal;
    const effectiveApy = ((finalAmount / principal - 1) * 100);

    const breakdown: { day: number; amount: number }[] = [];
    for (let i = 1; i <= days; i++) {
      const amount = principal * Math.pow(1 + rate / n, n * (i / 365));
      breakdown.push({ day: i, amount: Math.round(amount * 100) / 100 });
    }

    return {
      finalAmount: Math.round(finalAmount * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      effectiveApy: Math.round(effectiveApy * 100) / 100,
      breakdown,
    };
  }

  async getTopPools(limit: number = 10, sortBy: 'apy' | 'tvl' | 'volume' = 'apy'): Promise<LiquidityMiningPool[]> {
    const pools = this.generateMockPools();
    
    const sorted = [...pools].sort((a, b) => {
      if (sortBy === 'apy') return b.apy - a.apy;
      if (sortBy === 'tvl') return b.tvl - a.tvl;
      return b.volume24h - a.volume24h;
    });

    return sorted.slice(0, limit);
  }

  async searchPools(query: string): Promise<LiquidityMiningPool[]> {
    const pools = this.generateMockPools();
    const lowerQuery = query.toLowerCase();
    
    return pools.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.pair.toLowerCase().includes(lowerQuery) ||
        p.token0.toLowerCase().includes(lowerQuery) ||
        p.token1.toLowerCase().includes(lowerQuery) ||
        p.protocol.toLowerCase().includes(lowerQuery) ||
        p.chain.toLowerCase().includes(lowerQuery),
    );
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  getSupportedProtocols(): string[] {
    return this.supportedProtocols;
  }
}

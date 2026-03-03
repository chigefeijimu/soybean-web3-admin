import { Injectable } from '@nestjs/common';

export interface YieldPool {
  id: string;
  protocol: string;
  chain: string;
  pair: string;
  token0: string;
  token1: string;
  tvl: number;
  volume24h: number;
  apy: number;
  apr: number;
  rewardToken: string;
  rewardTokenPrice: number;
  risk: 'low' | 'medium' | 'high';
  poolAddress: string;
  farmType: 'single' | 'double' | 'triple';
  lockPeriod: number; // in days, 0 = unlimited
  impermanentLoss: number;
  lastUpdated: number;
}

export interface OptimizationRequest {
  principal: number;
  duration: number; // days
  riskTolerance: 'low' | 'medium' | 'high';
  preferredChains?: string[];
  preferredProtocols?: string[];
  tokenPreference?: string;
}

export interface OptimizationResult {
  strategies: StrategyAllocation[];
  totalExpectedReturn: number;
  totalRisk: number;
  recommendation: string;
}

export interface StrategyAllocation {
  protocol: string;
  chain: string;
  pool: string;
  allocation: number;
  expectedReturn: number;
  risk: number;
  reasons: string[];
}

export interface PoolHistoricalData {
  poolId: string;
  apyHistory: { timestamp: number; apy: number }[];
  tvlHistory: { timestamp: number; tvl: number }[];
  volumeHistory: { timestamp: number; volume: number }[];
}

@Injectable()
export class YieldFarmingOptimizerService {
  private readonly supportedChains = [
    'Ethereum',
    'Polygon',
    'Arbitrum',
    'Optimism',
    'Avalanche',
    'BSC',
    'Base',
  ];

  private readonly supportedProtocols = [
    'Uniswap',
    'Curve',
    'SushiSwap',
    'PancakeSwap',
    'QuickSwap',
    'Trader Joe',
    'Aerodrome',
    'Velodrome',
    'GMX',
    'Lido',
    'Yearn',
    'Aave',
    'Compound',
  ];

  private mockPools: YieldPool[] = this.generateMockPools();

  private generateMockPools(): YieldPool[] {
    const pools: YieldPool[] = [];
    const pairs = [
      { token0: 'ETH', token1: 'USDC' },
      { token0: 'WBTC', token1: 'USDC' },
      { token0: 'USDC', token1: 'USDT' },
      { token0: 'ETH', token1: 'WBTC' },
      { token0: 'DAI', token1: 'USDC' },
      { token0: 'MATIC', token1: 'ETH' },
      { token0: 'ARB', token1: 'ETH' },
      { token0: 'OP', token1: 'ETH' },
      { token0: 'AVAX', token1: 'USDC' },
      { token0: 'BNB', token1: 'USDC' },
      { token0: 'LINK', token1: 'ETH' },
      { token0: 'UNI', token1: 'ETH' },
      { token0: 'AAVE', token1: 'ETH' },
      { token0: 'CRV', token1: 'ETH' },
      { token0: 'LDO', token1: 'ETH' },
    ];

    let id = 1;
    for (const chain of this.supportedChains) {
      for (const protocol of this.supportedProtocols.slice(0, 6)) {
        for (let i = 0; i < 3; i++) {
          const pair = pairs[Math.floor(Math.random() * pairs.length)];
          const baseApy = 0.02 + Math.random() * 0.25;
          const rewardBoost = Math.random() > 0.5 ? Math.random() * 0.15 : 0;

          pools.push({
            id: `pool-${id++}`,
            protocol,
            chain,
            pair: `${pair.token0}/${pair.token1}`,
            token0: pair.token0,
            token1: pair.token1,
            tvl: 1000000 + Math.random() * 100000000,
            volume24h: 500000 + Math.random() * 50000000,
            apy: (baseApy + rewardBoost) * 100,
            apr: baseApy * 100,
            rewardToken: protocol === 'Lido' ? 'LDO' : protocol === 'Yearn' ? 'YFI' : 'TOKEN',
            rewardTokenPrice: 0.5 + Math.random() * 2000,
            risk: this.getRandomRisk(),
            poolAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
            farmType: Math.random() > 0.7 ? 'double' : Math.random() > 0.9 ? 'triple' : 'single',
            lockPeriod: Math.random() > 0.8 ? Math.floor(Math.random() * 30) + 7 : 0,
            impermanentLoss: Math.random() * 0.05,
            lastUpdated: Date.now(),
          });
        }
      }
    }
    return pools;
  }

  private getRandomRisk(): 'low' | 'medium' | 'high' {
    const r = Math.random();
    if (r < 0.4) return 'low';
    if (r < 0.75) return 'medium';
    return 'high';
  }

  async getPools(filters?: {
    chain?: string;
    protocol?: string;
    minTvl?: number;
    minApy?: number;
    risk?: string;
  }): Promise<YieldPool[]> {
    let pools = [...this.mockPools];

    if (filters?.chain) {
      pools = pools.filter((p) => p.chain.toLowerCase() === filters.chain.toLowerCase());
    }
    if (filters?.protocol) {
      pools = pools.filter((p) => p.protocol.toLowerCase() === filters.protocol.toLowerCase());
    }
    if (filters?.minTvl) {
      pools = pools.filter((p) => p.tvl >= filters.minTvl);
    }
    if (filters?.minApy) {
      pools = pools.filter((p) => p.apy >= filters.minApy);
    }
    if (filters?.risk) {
      pools = pools.filter((p) => p.risk === filters.risk);
    }

    return pools.sort((a, b) => b.apy - a.apy);
  }

  async getPoolDetails(poolId: string): Promise<YieldPool | null> {
    return this.mockPools.find((p) => p.id === poolId) || null;
  }

  async getTopPools(limit = 10, chain?: string): Promise<YieldPool[]> {
    let pools = [...this.mockPools];
    if (chain) {
      pools = pools.filter((p) => p.chain.toLowerCase() === chain.toLowerCase());
    }
    return pools.sort((a, b) => b.apy - a.apy).slice(0, limit);
  }

  async optimizeYield(request: OptimizationRequest): Promise<OptimizationResult> {
    const { principal, duration, riskTolerance, preferredChains, preferredProtocols, tokenPreference } = request;

    // Filter pools based on preferences
    let eligiblePools = [...this.mockPools];

    if (preferredChains?.length) {
      eligiblePools = eligiblePools.filter((p) =>
        preferredChains.some((c) => p.chain.toLowerCase() === c.toLowerCase())
      );
    }

    if (preferredProtocols?.length) {
      eligiblePools = eligiblePools.filter((p) =>
        preferredProtocols.some((pr) => p.protocol.toLowerCase() === pr.toLowerCase())
      );
    }

    if (tokenPreference) {
      eligiblePools = eligiblePools.filter(
        (p) =>
          p.token0.toLowerCase() === tokenPreference.toLowerCase() ||
          p.token1.toLowerCase() === tokenPreference.toLowerCase()
      );
    }

    // Filter by risk tolerance
    const riskOrder = { low: 1, medium: 2, high: 3 };
    eligiblePools = eligiblePools.filter(
      (p) => riskOrder[p.risk] <= riskOrder[riskTolerance]
    );

    // Score pools
    const scoredPools = eligiblePools.map((pool) => {
      let score = pool.apy;

      // Risk adjustment
      if (pool.risk === 'low') score *= 1.1;
      if (pool.risk === 'medium') score *= 1.0;
      if (pool.risk === 'high') score *= 0.9;

      // TVL boost (liquidity matters)
      if (pool.tvl > 10000000) score *= 1.05;
      if (pool.tvl > 100000000) score *= 1.1;

      // Volume boost
      if (pool.volume24h > 10000000) score *= 1.05;

      // Lock period penalty
      if (pool.lockPeriod > 0) score *= 0.95;

      // Impermanent loss consideration
      score -= pool.impermanentLoss * 100;

      return { pool, score };
    });

    // Sort by score
    scoredPools.sort((a, b) => b.score - a.score);

    // Create allocation strategy
    const strategies: StrategyAllocation[] = [];
    let remainingAllocation = 100;
    let totalExpectedReturn = 0;
    let totalRisk = 0;

    // Top 3-5 pools for diversification
    const numPools = Math.min(5, scoredPools.length);
    const weights = this.calculateWeights(scoredPools.slice(0, numPools).map(s => s.score));

    for (let i = 0; i < numPools; i++) {
      const { pool, score } = scoredPools[i];
      const allocation = weights[i] * 100;
      const expectedReturn = (principal * (pool.apy / 100) * (duration / 365));
      const riskScore = pool.risk === 'low' ? 1 : pool.risk === 'medium' ? 2 : 3;

      strategies.push({
        protocol: pool.protocol,
        chain: pool.chain,
        pool: pool.pair,
        allocation: Math.round(allocation),
        expectedReturn: Math.round(expectedReturn * 100) / 100,
        risk: riskScore,
        reasons: this.generateReasons(pool),
      });

      totalExpectedReturn += expectedReturn * (weights[i]);
      totalRisk += riskScore * (weights[i]);
      remainingAllocation -= allocation;
    }

    // Add remaining to top pool
    if (strategies.length > 0 && remainingAllocation > 0) {
      strategies[0].allocation += remainingAllocation;
    }

    return {
      strategies,
      totalExpectedReturn: Math.round(totalExpectedReturn * 100) / 100,
      totalRisk: Math.round(totalRisk * 100) / 100,
      recommendation: this.generateRecommendation(strategies, riskTolerance),
    };
  }

  private calculateWeights(scores: number[]): number[] {
    const total = scores.reduce((sum, s) => sum + s, 0);
    return scores.map((s) => s / total);
  }

  private generateReasons(pool: YieldPool): string[] {
    const reasons: string[] = [];

    if (pool.apy > 20) reasons.push('High APY yield opportunity');
    if (pool.tvl > 10000000) reasons.push('Strong liquidity depth');
    if (pool.volume24h > 10000000) reasons.push('High trading volume');
    if (pool.risk === 'low') reasons.push('Low risk profile');
    if (pool.farmType === 'double') reasons.push('Dual token rewards');
    if (pool.lockPeriod === 0) reasons.push('No lock-up period');

    return reasons;
  }

  private generateRecommendation(strategies: StrategyAllocation[], riskTolerance: string): string {
    if (strategies.length === 0) {
      return 'No suitable pools found for the given criteria.';
    }

    const topPool = strategies[0];
    return `Recommended strategy allocates ${topPool.allocation}% to ${topPool.pool} on ${topPool.chain} via ${topPool.protocol}. This offers the best risk-adjusted return with ${topPool.reasons[0] || 'favorable yield characteristics'}.`;
  }

  async getHistoricalData(poolId: string, days = 30): Promise<PoolHistoricalData> {
    const pool = this.mockPools.find((p) => p.id === poolId);
    if (!pool) {
      return { poolId, apyHistory: [], tvlHistory: [], volumeHistory: [] };
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const points = [];

    for (let i = days; i >= 0; i--) {
      points.push(now - i * dayMs);
    }

    return {
      poolId,
      apyHistory: points.map((ts, idx) => ({
        timestamp: ts,
        apy: pool.apy * (0.8 + Math.random() * 0.4),
      })),
      tvlHistory: points.map((ts) => ({
        timestamp: ts,
        tvl: pool.tvl * (0.7 + Math.random() * 0.6),
      })),
      volumeHistory: points.map((ts) => ({
        timestamp: ts,
        volume: pool.volume24h * (0.5 + Math.random()),
      })),
    };
  }

  async calculateCompoundGrowth(
    principal: number,
    apy: number,
    frequency: 'daily' | 'weekly' | 'monthly',
    days: number
  ): Promise<{
    finalAmount: number;
    totalReturn: number;
    breakdown: { period: number; amount: number }[];
  }> {
    const periodsPerYear = frequency === 'daily' ? 365 : frequency === 'weekly' ? 52 : 12;
    const periods = Math.floor((days / 365) * periodsPerYear);
    const ratePerPeriod = apy / 100 / periodsPerYear;

    const breakdown: { period: number; amount: number }[] = [];
    let amount = principal;

    for (let i = 1; i <= periods; i++) {
      amount = amount * (1 + ratePerPeriod);
      if (frequency === 'daily' ? i % 30 === 0 : frequency === 'weekly' ? i % 4 === 0 : i % 1 === 0) {
        breakdown.push({ period: i, amount: Math.round(amount * 100) / 100 });
      }
    }

    return {
      finalAmount: Math.round(amount * 100) / 100,
      totalReturn: Math.round((amount - principal) * 100) / 100,
      breakdown,
    };
  }

  async comparePools(poolIds: string[]): Promise<{
    pools: YieldPool[];
    comparison: {
      highestApy: string;
      lowestRisk: string;
      highestTvl: string;
      bestLiquidity: string;
    };
  }> {
    const pools = poolIds
      .map((id) => this.mockPools.find((p) => p.id === id))
      .filter(Boolean);

    return {
      pools,
      comparison: {
        highestApy: pools.sort((a, b) => b.apy - a.apy)[0]?.id || '',
        lowestRisk: pools.filter(p => p.risk === 'low').sort((a, b) => b.tvl - a.tvl)[0]?.id || '',
        highestTvl: pools.sort((a, b) => b.tvl - a.tvl)[0]?.id || '',
        bestLiquidity: pools.sort((a, b) => b.volume24h - a.volume24h)[0]?.id || '',
      },
    };
  }

  async getMarketOverview(): Promise<{
    totalTvl: number;
    totalVolume24h: number;
    averageApy: number;
    topChains: { chain: string; tvl: number; pools: number }[];
    topProtocols: { protocol: string; tvl: number; pools: number }[];
  }> {
    const pools = this.mockPools;

    const totalTvl = pools.reduce((sum, p) => sum + p.tvl, 0);
    const totalVolume24h = pools.reduce((sum, p) => sum + p.volume24h, 0);
    const averageApy = pools.reduce((sum, p) => sum + p.apy, 0) / pools.length;

    const chainMap = new Map<string, { tvl: number; pools: number }>();
    const protocolMap = new Map<string, { tvl: number; pools: number }>();

    for (const pool of pools) {
      const chainData = chainMap.get(pool.chain) || { tvl: 0, pools: 0 };
      chainData.tvl += pool.tvl;
      chainData.pools++;
      chainMap.set(pool.chain, chainData);

      const protocolData = protocolMap.get(pool.protocol) || { tvl: 0, pools: 0 };
      protocolData.tvl += pool.tvl;
      protocolData.pools++;
      protocolMap.set(pool.protocol, protocolData);
    }

    return {
      totalTvl: Math.round(totalTvl),
      totalVolume24h: Math.round(totalVolume24h),
      averageApy: Math.round(averageApy * 100) / 100,
      topChains: Array.from(chainMap.entries())
        .map(([chain, data]) => ({ chain, ...data }))
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 5),
      topProtocols: Array.from(protocolMap.entries())
        .map(([protocol, data]) => ({ protocol, ...data }))
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 5),
    };
  }
}

import { Injectable } from '@nestjs/common';

interface StrategyParams {
  capital: number;
  riskTolerance: 'low' | 'medium' | 'high';
  preferredChains: string[];
  preferredProtocols: string[];
  investmentGoal: 'stable' | 'balanced' | 'aggressive';
  timeframe: 'short' | 'medium' | 'long';
}

interface YieldPool {
  protocol: string;
  chain: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  category: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  totalApy: number;
  riskScore: number;
  allocations: Allocation[];
  expectedReturn: number;
  recommendation: string;
}

interface Allocation {
  protocol: string;
  chain: string;
  pool: string;
  percentage: number;
  amount: number;
  apy: number;
}

@Injectable()
export class YieldFarmingStrategyService {
  private readonly mockPools: YieldPool[] = [
    // Ethereum
    { protocol: 'Aave', chain: 'ethereum', pool: 'ETH', apy: 4.2, tvl: 15000000000, risk: 'low', category: 'lending' },
    { protocol: 'Compound', chain: 'ethereum', pool: 'ETH', apy: 3.8, tvl: 8000000000, risk: 'low', category: 'lending' },
    { protocol: 'Uniswap V3', chain: 'ethereum', pool: 'USDC/ETH', apy: 12.5, tvl: 2500000000, risk: 'medium', category: 'dex' },
    { protocol: 'Curve', chain: 'ethereum', pool: 'ETH/stETH', apy: 5.8, tvl: 1800000000, risk: 'low', category: 'dex' },
    { protocol: 'Yearn', chain: 'ethereum', pool: 'ETH', apy: 8.5, tvl: 5000000000, risk: 'medium', category: 'yield' },
    { protocol: 'Lido', chain: 'ethereum', pool: 'stETH', apy: 4.5, tvl: 32000000000, risk: 'low', category: 'staking' },
    // Arbitrum
    { protocol: 'Aave', chain: 'arbitrum', pool: 'ETH', apy: 5.2, tvl: 1200000000, risk: 'low', category: 'lending' },
    { protocol: 'GMX', chain: 'arbitrum', pool: 'ETH-USDC', apy: 15.8, tvl: 600000000, risk: 'high', category: 'dex' },
    { protocol: 'Camelot', chain: 'arbitrum', pool: 'ETH-GRAIL', apy: 25.5, tvl: 150000000, risk: 'high', category: 'dex' },
    // Optimism
    { protocol: 'Aave', chain: 'optimism', pool: 'ETH', apy: 4.8, tvl: 800000000, risk: 'low', category: 'lending' },
    { protocol: 'Velodrome', chain: 'optimism', pool: 'OP-ETH', apy: 18.5, tvl: 300000000, risk: 'medium', category: 'dex' },
    // Polygon
    { protocol: 'Aave', chain: 'polygon', pool: 'MATIC', apy: 6.5, tvl: 1500000000, risk: 'low', category: 'lending' },
    { protocol: 'QuickSwap', chain: 'polygon', pool: 'MATIC-USDC', apy: 14.2, tvl: 400000000, risk: 'medium', category: 'dex' },
    // Avalanche
    { protocol: 'Aave', chain: 'avalanche', pool: 'AVAX', apy: 5.8, tvl: 700000000, risk: 'low', category: 'lending' },
    { protocol: 'Trader Joe', chain: 'avalanche', pool: 'AVAX-USDC', apy: 12.8, tvl: 250000000, risk: 'medium', category: 'dex' },
    // Base
    { protocol: 'Aave', chain: 'base', pool: 'ETH', apy: 5.5, tvl: 500000000, risk: 'low', category: 'lending' },
    { protocol: 'Aerodrome', chain: 'base', pool: 'ETH-USDC', apy: 16.2, tvl: 400000000, risk: 'medium', category: 'dex' },
    // BSC
    { protocol: 'Venus', chain: 'bsc', pool: 'BNB', apy: 8.5, tvl: 2000000000, risk: 'medium', category: 'lending' },
    { protocol: 'PancakeSwap', chain: 'bsc', pool: 'CAKE', apy: 22.5, tvl: 800000000, risk: 'high', category: 'dex' },
  ];

  async generateStrategy(params: StrategyParams): Promise<Strategy> {
    const { capital, riskTolerance, preferredChains, preferredProtocols, investmentGoal, timeframe } = params;

    // Filter pools based on preferences
    let eligiblePools = this.mockPools.filter(pool => {
      const chainMatch = preferredChains.length === 0 || preferredChains.includes(pool.chain);
      const protocolMatch = preferredProtocols.length === 0 || preferredProtocols.includes(pool.protocol);
      return chainMatch && protocolMatch;
    });

    // Apply risk tolerance filter
    if (riskTolerance === 'low') {
      eligiblePools = eligiblePools.filter(p => p.risk === 'low');
    } else if (riskTolerance === 'medium') {
      eligiblePools = eligiblePools.filter(p => p.risk !== 'high');
    }

    // Sort by APY (adjusted by risk)
    eligiblePools = eligiblePools.sort((a, b) => {
      const aScore = a.apy * (a.risk === 'low' ? 1.2 : a.risk === 'medium' ? 1.0 : 0.8);
      const bScore = b.apy * (b.risk === 'low' ? 1.2 : b.risk === 'medium' ? 1.0 : 0.8);
      return bScore - aScore;
    });

    // Generate allocations based on investment goal
    const allocations = this.generateAllocations(capital, eligiblePools, investmentGoal);

    // Calculate totals
    const totalApy = allocations.reduce((sum, a) => sum + (a.apy * a.percentage / 100), 0);
    const expectedReturn = capital * (totalApy / 100);
    const avgRisk = allocations.reduce((sum, a) => sum + (a.risk === 'low' ? 1 : a.risk === 'medium' ? 2 : 3), 0) / allocations.length;
    const riskScore = Math.min(100, Math.round(avgRisk * 33));

    // Generate strategy name and description
    const strategyNames = {
      stable: ['Conservative Yield', 'Stable Income', 'Low-Risk Growth'],
      balanced: ['Balanced Growth', 'Diversified Yield', 'Steady Returns'],
      aggressive: ['High Yield Max', 'Aggressive Farming', 'Maximum APY'],
    };

    const name = strategyNames[investmentGoal][Math.floor(Math.random() * 3)];
    const description = this.generateDescription(investmentGoal, timeframe, totalApy);
    const recommendation = this.generateRecommendation(investmentGoal, riskTolerance, timeframe);

    return {
      id: `strategy_${Date.now()}`,
      name,
      description,
      totalApy: Math.round(totalApy * 100) / 100,
      riskScore,
      allocations,
      expectedReturn: Math.round(expectedReturn * 100) / 100,
      recommendation,
    };
  }

  private generateAllocations(capital: number, pools: YieldPool[], goal: string): Allocation[] {
    const allocations: Allocation[] = [];
    let remainingPercent = 100;

    if (goal === 'stable') {
      // Focus on low-risk, stable pools
      const stablePools = pools.filter(p => p.risk === 'low').slice(0, 3);
      stablePools.forEach((pool, i) => {
        const percent = i === stablePools.length - 1 ? remainingPercent : Math.min(40, Math.floor(Math.random() * 20) + 30);
        allocations.push({
          protocol: pool.protocol,
          chain: pool.chain,
          pool: pool.pool,
          percentage: percent,
          amount: Math.round(capital * percent / 100),
          apy: pool.apy,
        });
        remainingPercent -= percent;
      });
    } else if (goal === 'balanced') {
      // Mix of low and medium risk
      const lowRisk = pools.filter(p => p.risk === 'low').slice(0, 2);
      const medRisk = pools.filter(p => p.risk === 'medium').slice(0, 2);
      
      lowRisk.forEach((pool, i) => {
        const percent = 30 + Math.floor(Math.random() * 10);
        allocations.push({
          protocol: pool.protocol,
          chain: pool.chain,
          pool: pool.pool,
          percentage: percent,
          amount: Math.round(capital * percent / 100),
          apy: pool.apy,
        });
        remainingPercent -= percent;
      });

      medRisk.forEach((pool) => {
        if (remainingPercent > 0) {
          const percent = Math.min(remainingPercent, 15 + Math.floor(Math.random() * 10));
          allocations.push({
            protocol: pool.protocol,
            chain: pool.chain,
            pool: pool.pool,
            percentage: percent,
            amount: Math.round(capital * percent / 100),
            apy: pool.apy,
          });
          remainingPercent -= percent;
        }
      });
    } else {
      // Aggressive - include high APY pools
      const topPools = pools.slice(0, 4);
      topPools.forEach((pool, i) => {
        const percent = i === topPools.length - 1 ? remainingPercent : Math.min(35, 20 + Math.floor(Math.random() * 15));
        allocations.push({
          protocol: pool.protocol,
          chain: pool.chain,
          pool: pool.pool,
          percentage: percent,
          amount: Math.round(capital * percent / 100),
          apy: pool.apy,
        });
        remainingPercent -= percent;
      });
    }

    return allocations.filter(a => a.percentage > 0);
  }

  private generateDescription(goal: string, timeframe: string, apy: number): string {
    const goalText = {
      stable: 'Focus on capital preservation with stable, lower-yield strategies',
      balanced: 'Diversified approach balancing risk and reward for steady growth',
      aggressive: 'Maximum yield strategy accepting higher volatility for higher returns',
    };

    const timeframeText = {
      short: 'Short-term optimization for quick returns',
      medium: 'Medium-term strategy with monthly rebalancing recommended',
      long: 'Long-term compounding strategy for maximum wealth accumulation',
    };

    return `${goalText[goal]} ${timeframeText[timeframe]} Target APY: ${apy.toFixed(2)}%`;
  }

  private generateRecommendation(goal: string, risk: string, timeframe: string): string {
    const recommendations: string[] = [];

    if (goal === 'stable') {
      recommendations.push('Consider auto-compounding for additional yield');
      recommendations.push('Monitor for any liquidity changes weekly');
    }

    if (timeframe === 'short') {
      recommendations.push('Be prepared for impermanent loss in volatile pools');
      recommendations.push('Consider taking profits monthly');
    }

    if (timeframe === 'long') {
      recommendations.push('Enable auto-compound to maximize returns');
      recommendations.push('Rebalance quarterly based on performance');
    }

    if (risk === 'low') {
      recommendations.push('Focus on lending protocols for stability');
    }

    recommendations.push('Always verify smart contract audits before depositing');
    recommendations.push('Keep 10% in stablecoins for opportunities');

    return recommendations.join('. ');
  }

  async getMarketOverview(): Promise<any> {
    const chains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'base', 'bsc'];
    const overview = chains.map(chain => {
      const chainPools = this.mockPools.filter(p => p.chain === chain);
      const avgApy = chainPools.reduce((sum, p) => sum + p.apy, 0) / chainPools.length;
      const totalTvl = chainPools.reduce((sum, p) => sum + p.tvl, 0);
      
      return {
        chain,
        avgApy: Math.round(avgApy * 100) / 100,
        totalTvl,
        poolCount: chainPools.length,
        topPool: chainPools.sort((a, b) => b.apy - a.apy)[0],
      };
    });

    return {
      timestamp: new Date().toISOString(),
      chains: overview.sort((a, b) => b.avgApy - a.avgApy),
      marketTrend: 'bullish' as const,
      totalPools: this.mockPools.length,
    };
  }

  async getTopStrategies(): Promise<any[]> {
    const strategies = [
      {
        id: 'strat_1',
        name: 'Ethereum Staking Bundle',
        description: 'Low-risk ETH staking with Lido and Aave',
        apy: 5.2,
        risk: 'low',
        chains: ['ethereum'],
      },
      {
        id: 'strat_2',
        name: 'Cross-chain Balanced',
        description: 'Diversified across 4 chains with balanced risk',
        apy: 12.5,
        risk: 'medium',
        chains: ['ethereum', 'arbitrum', 'optimism', 'base'],
      },
      {
        id: 'strat_3',
        name: 'Arbitrum Yield Max',
        description: 'High yield focus on Arbitrum DeFi',
        apy: 22.8,
        risk: 'high',
        chains: ['arbitrum'],
      },
      {
        id: 'strat_4',
        name: 'Stablecoin Farming',
        description: 'USDC/USDT yield on major protocols',
        apy: 8.5,
        risk: 'low',
        chains: ['ethereum', 'polygon', 'avalanche'],
      },
      {
        id: 'strat_5',
        name: 'L2 Arbitrage',
        description: 'Cross-L2 yield opportunities',
        apy: 18.2,
        risk: 'medium',
        chains: ['arbitrum', 'optimism', 'base'],
      },
    ];

    return strategies;
  }

  async getProtocols(): Promise<any[]> {
    const protocols = this.mockPools.map(p => p.protocol).filter((v, i, a) => a.indexOf(v) === i);
    return protocols.map(p => {
      const pools = this.mockPools.filter(pool => pool.protocol === p);
      return {
        name: p,
        chains: [...new Set(pools.map(p => p.chain))],
        avgApy: Math.round(pools.reduce((s, p) => s + p.apy, 0) / pools.length * 100) / 100,
        totalTvl: pools.reduce((s, p) => s + p.tvl, 0),
        category: pools[0].category,
      };
    });
  }
}

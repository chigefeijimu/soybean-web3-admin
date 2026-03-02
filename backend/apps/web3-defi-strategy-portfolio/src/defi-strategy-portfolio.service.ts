import { Injectable } from '@nestjs/common';

export interface Strategy {
  id: string;
  name: string;
  type: 'lending' | 'liquidity' | 'staking' | 'farming' | 'yield' | 'hybrid';
  protocol: string;
  chain: string;
  chainId: number;
  tvl: number;
  apy: number;
  apy7d?: number;
  apy30d?: number;
  risk: 'low' | 'medium' | 'high';
  allocation: number; // percentage of portfolio
  entryDate: string;
  lastHarvest?: string;
  pnl30d: number;
  pnlTotal: number;
}

export interface StrategyPortfolio {
  id: string;
  name: string;
  walletAddress: string;
  strategies: Strategy[];
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  weightedApy: number;
  riskScore: number;
  lastUpdated: string;
}

export interface PortfolioPerformance {
  totalValue: number;
  totalValue7dAgo: number;
  totalValue30dAgo: number;
  pnl7d: number;
  pnl7dPercent: number;
  pnl30d: number;
  pnl30dPercent: number;
  dailyYield: number;
  impermanentLoss: number;
  feesPaid7d: number;
}

export interface RebalanceRecommendation {
  strategyId: string;
  currentAllocation: number;
  recommendedAllocation: number;
  action: 'increase' | 'decrease' | 'hold';
  reason: string;
  expectedImpact: number;
}

@Injectable()
export class DefiStrategyPortfolioService {
  private portfolios = new Map<string, StrategyPortfolio>();
  
  // Sample strategies database
  private sampleStrategies: Strategy[] = [
    {
      id: 'strat-1',
      name: 'ETH Staking (Lido)',
      type: 'staking',
      protocol: 'Lido',
      chain: 'Ethereum',
      chainId: 1,
      tvl: 32000000000,
      apy: 3.2,
      apy7d: 3.1,
      apy30d: 3.4,
      risk: 'low',
      allocation: 30,
      entryDate: '2025-06-15',
      lastHarvest: '2026-03-01',
      pnl30d: 2.8,
      pnlTotal: 15.2,
    },
    {
      id: 'strat-2',
      name: 'USDC Lending (Aave)',
      type: 'lending',
      protocol: 'Aave',
      chain: 'Ethereum',
      chainId: 1,
      tvl: 15000000000,
      apy: 4.5,
      apy7d: 4.3,
      apy30d: 4.8,
      risk: 'low',
      allocation: 25,
      entryDate: '2025-08-20',
      lastHarvest: '2026-03-02',
      pnl30d: 4.2,
      pnlTotal: 22.5,
    },
    {
      id: 'strat-3',
      name: 'ETH-USDC LP (Uniswap V3)',
      type: 'liquidity',
      protocol: 'Uniswap V3',
      chain: 'Ethereum',
      chainId: 1,
      tvl: 2500000000,
      apy: 18.5,
      apy7d: 16.2,
      apy30d: 22.1,
      risk: 'medium',
      allocation: 20,
      entryDate: '2025-10-10',
      lastHarvest: '2026-02-28',
      pnl30d: 12.5,
      pnlTotal: 45.8,
    },
    {
      id: 'strat-4',
      name: 'ARB Staking (Lido)',
      type: 'staking',
      protocol: 'Lido',
      chain: 'Arbitrum',
      chainId: 42161,
      tvl: 1800000000,
      apy: 8.2,
      apy7d: 7.9,
      apy30d: 8.5,
      risk: 'medium',
      allocation: 15,
      entryDate: '2025-11-05',
      lastHarvest: '2026-03-01',
      pnl30d: 7.8,
      pnlTotal: 28.4,
    },
    {
      id: 'strat-5',
      name: 'GMX Trading (GMX)',
      type: 'yield',
      protocol: 'GMX',
      chain: 'Arbitrum',
      chainId: 42161,
      tvl: 800000000,
      apy: 12.5,
      apy7d: 11.8,
      apy30d: 14.2,
      risk: 'high',
      allocation: 10,
      entryDate: '2025-12-01',
      lastHarvest: '2026-02-25',
      pnl30d: 9.2,
      pnlTotal: 32.1,
    },
  ];

  /**
   * Get all available strategies
   */
  getAllStrategies(): Strategy[] {
    return this.sampleStrategies;
  }

  /**
   * Get strategies by chain
   */
  getStrategiesByChain(chainId: number): Strategy[] {
    return this.sampleStrategies.filter(s => s.chainId === chainId);
  }

  /**
   * Get strategies by type
   */
  getStrategiesByType(type: string): Strategy[] {
    return this.sampleStrategies.filter(s => s.type === type);
  }

  /**
   * Get strategies by risk level
   */
  getStrategiesByRisk(risk: 'low' | 'medium' | 'high'): Strategy[] {
    return this.sampleStrategies.filter(s => s.risk === risk);
  }

  /**
   * Get portfolio by wallet address
   */
  getPortfolio(walletAddress: string): StrategyPortfolio {
    const key = walletAddress.toLowerCase();
    
    if (!this.portfolios.has(key)) {
      // Create a sample portfolio for the wallet
      this.portfolios.set(key, this.createSamplePortfolio(key));
    }
    
    return this.portfolios.get(key);
  }

  /**
   * Create a sample portfolio
   */
  private createSamplePortfolio(walletAddress: string): StrategyPortfolio {
    const strategies = this.sampleStrategies.slice(0, 4).map(s => ({
      ...s,
      allocation: s.allocation, // Keep original allocations
    }));
    
    const totalValue = 125000; // Sample portfolio value in USD
    const totalPnL = strategies.reduce((acc, s) => acc + (s.pnlTotal / 100 * totalValue * (s.allocation / 100)), 0);
    const totalPnLPercent = (totalPnL / totalValue) * 100;
    
    const weightedApy = strategies.reduce((acc, s) => acc + (s.apy * s.allocation / 100), 0);
    
    // Calculate risk score based on strategy allocations
    const riskScore = this.calculateRiskScore(strategies);

    return {
      id: `portfolio-${walletAddress.slice(0, 8)}`,
      name: 'Main DeFi Portfolio',
      walletAddress,
      strategies,
      totalValue,
      totalPnL,
      totalPnLPercent,
      weightedApy,
      riskScore,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate portfolio risk score (0-100)
   */
  private calculateRiskScore(strategies: Strategy[]): number {
    let score = 0;
    const weights = { low: 1, medium: 2, high: 3 };
    
    strategies.forEach(s => {
      score += weights[s.risk] * s.allocation;
    });
    
    return Math.min(100, Math.round(score / 3));
  }

  /**
   * Get portfolio performance metrics
   */
  getPortfolioPerformance(walletAddress: string): PortfolioPerformance {
    const portfolio = this.getPortfolio(walletAddress);
    
    // Generate sample performance data
    const totalValue = portfolio.totalValue;
    const totalValue7dAgo = totalValue * 0.97; // -3%
    const totalValue30dAgo = totalValue * 0.88; // -12%
    
    const pnl7d = totalValue - totalValue7dAgo;
    const pnl7dPercent = ((totalValue / totalValue7dAgo) - 1) * 100;
    const pnl30d = totalValue - totalValue30dAgo;
    const pnl30dPercent = ((totalValue / totalValue30dAgo) - 1) * 100;
    
    const dailyYield = (portfolio.weightedApy / 365) * totalValue;
    const impermanentLoss = totalValue * 0.02; // Sample 2% IL
    const feesPaid7d = totalValue * 0.003; // Sample 0.3% fees

    return {
      totalValue,
      totalValue7dAgo,
      totalValue30dAgo,
      pnl7d,
      pnl7dPercent,
      pnl30d,
      pnl30dPercent,
      dailyYield,
      impermanentLoss,
      feesPaid7d,
    };
  }

  /**
   * Get rebalancing recommendations
   */
  getRebalanceRecommendations(walletAddress: string): RebalanceRecommendation[] {
    const portfolio = this.getPortfolio(walletAddress);
    const recommendations: RebalanceRecommendation[] = [];
    
    // Ideal allocation based on risk tolerance
    const idealAllocations = {
      low: 60,
      medium: 30,
      high: 10,
    };

    // Current allocation by risk
    const currentAllocations = {
      low: portfolio.strategies.filter(s => s.risk === 'low').reduce((acc, s) => acc + s.allocation, 0),
      medium: portfolio.strategies.filter(s => s.risk === 'medium').reduce((acc, s) => acc + s.allocation, 0),
      high: portfolio.strategies.filter(s => s.risk === 'high').reduce((acc, s) => acc + s.allocation, 0),
    };

    // Check high-risk allocation
    if (currentAllocations.high > idealAllocations.high) {
      const excessHighRisk = currentAllocations.high - idealAllocations.high;
      const highRiskStrategy = portfolio.strategies.find(s => s.risk === 'high');
      if (highRiskStrategy) {
        recommendations.push({
          strategyId: highRiskStrategy.id,
          currentAllocation: highRiskStrategy.allocation,
          recommendedAllocation: highRiskStrategy.allocation - excessHighRisk,
          action: 'decrease',
          reason: 'High-risk allocation exceeds recommended threshold',
          expectedImpact: -excessHighRisk * 0.5, // Risk reduction impact
        });
      }
    }

    // Check for low-risk underallocation
    if (currentAllocations.low < idealAllocations.low) {
      const lowRiskStrategies = portfolio.strategies.filter(s => s.risk === 'low');
      const lowRiskStrategy = lowRiskStrategies.sort((a, b) => b.apy - a.apy)[0];
      if (lowRiskStrategy) {
        recommendations.push({
          strategyId: lowRiskStrategy.id,
          currentAllocation: lowRiskStrategy.allocation,
          recommendedAllocation: lowRiskStrategy.allocation + 10,
          action: 'increase',
          reason: 'Low-risk allocation below target - consider increasing for stability',
          expectedImpact: 10 * 0.04, // Expected yield impact
        });
      }
    }

    // Check for underperforming strategies
    portfolio.strategies.forEach(s => {
      if (s.pnl30d < 3 && s.risk === 'medium') {
        recommendations.push({
          strategyId: s.id,
          currentAllocation: s.allocation,
          recommendedAllocation: s.allocation * 0.8,
          action: 'decrease',
          reason: `Underperforming: ${s.pnl30d.toFixed(1)}% 30d return`,
          expectedImpact: -s.allocation * 0.2 * 0.05,
        });
      }
    });

    return recommendations;
  }

  /**
   * Get top performing strategies
   */
  getTopStrategies(limit: number = 10, sortBy: 'apy' | 'pnl' | 'tvl' = 'apy'): Strategy[] {
    const sorted = [...this.sampleStrategies];
    
    switch (sortBy) {
      case 'apy':
        sorted.sort((a, b) => b.apy - a.apy);
        break;
      case 'pnl':
        sorted.sort((a, b) => b.pnl30d - a.pnl30d);
        break;
      case 'tvl':
        sorted.sort((a, b) => b.tvl - a.tvl);
        break;
    }
    
    return sorted.slice(0, limit);
  }

  /**
   * Get strategy details by ID
   */
  getStrategyById(id: string): Strategy | undefined {
    return this.sampleStrategies.find(s => s.id === id);
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary(walletAddress: string) {
    const portfolio = this.getPortfolio(walletAddress);
    const performance = this.getPortfolioPerformance(walletAddress);
    const recommendations = this.getRebalanceRecommendations(walletAddress);

    return {
      portfolio: {
        totalValue: portfolio.totalValue,
        strategyCount: portfolio.strategies.length,
        weightedApy: portfolio.weightedApy,
        riskScore: portfolio.riskScore,
        riskLevel: portfolio.riskScore < 40 ? 'low' : portfolio.riskScore < 70 ? 'medium' : 'high',
      },
      performance: {
        pnl7d: performance.pnl7d,
        pnl7dPercent: performance.pnl7dPercent,
        pnl30d: performance.pnl30d,
        pnl30dPercent: performance.pnl30dPercent,
        dailyYield: performance.dailyYield,
      },
      recommendations: {
        count: recommendations.length,
        actions: recommendations.map(r => r.action),
      },
      allocation: {
        byRisk: {
          low: portfolio.strategies.filter(s => s.risk === 'low').reduce((acc, s) => acc + s.allocation, 0),
          medium: portfolio.strategies.filter(s => s.risk === 'medium').reduce((acc, s) => acc + s.allocation, 0),
          high: portfolio.strategies.filter(s => s.risk === 'high').reduce((acc, s) => acc + s.allocation, 0),
        },
        byType: portfolio.strategies.reduce((acc, s) => {
          acc[s.type] = (acc[s.type] || 0) + s.allocation;
          return acc;
        }, {} as Record<string, number>),
        byChain: portfolio.strategies.reduce((acc, s) => {
          acc[s.chain] = (acc[s.chain] || 0) + s.allocation;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  }

  /**
   * Get market overview for DeFi strategies
   */
  getMarketOverview() {
    const strategiesByType = {
      lending: this.sampleStrategies.filter(s => s.type === 'lending'),
      liquidity: this.sampleStrategies.filter(s => s.type === 'liquidity'),
      staking: this.sampleStrategies.filter(s => s.type === 'staking'),
      farming: this.sampleStrategies.filter(s => s.type === 'farming'),
      yield: this.sampleStrategies.filter(s => s.type === 'yield'),
    };

    return {
      totalTvL: this.sampleStrategies.reduce((acc, s) => acc + s.tvl, 0),
      averageApy: this.sampleStrategies.reduce((acc, s) => acc + s.apy, 0) / this.sampleStrategies.length,
      strategiesCount: this.sampleStrategies.length,
      byType: {
        lending: {
          count: strategiesByType.lending.length,
          avgApy: strategiesByType.lending.length 
            ? strategiesByType.lending.reduce((acc, s) => acc + s.apy, 0) / strategiesByType.lending.length 
            : 0,
          topTvL: strategiesByType.lending.sort((a, b) => b.tvl - a.tvl)[0],
        },
        liquidity: {
          count: strategiesByType.liquidity.length,
          avgApy: strategiesByType.liquidity.length 
            ? strategiesByType.liquidity.reduce((acc, s) => acc + s.apy, 0) / strategiesByType.liquidity.length 
            : 0,
          topTvL: strategiesByType.liquidity.sort((a, b) => b.tvl - a.tvl)[0],
        },
        staking: {
          count: strategiesByType.staking.length,
          avgApy: strategiesByType.staking.length 
            ? strategiesByType.staking.reduce((acc, s) => acc + s.apy, 0) / strategiesByType.staking.length 
            : 0,
          topTvL: strategiesByType.staking.sort((a, b) => b.tvl - a.tvl)[0],
        },
        farming: {
          count: strategiesByType.farming.length,
          avgApy: strategiesByType.farming.length 
            ? strategiesByType.farming.reduce((acc, s) => acc + s.apy, 0) / strategiesByType.farming.length 
            : 0,
          topTvL: strategiesByType.farming.sort((a, b) => b.tvl - a.tvl)[0],
        },
        yield: {
          count: strategiesByType.yield.length,
          avgApy: strategiesByType.yield.length 
            ? strategiesByType.yield.reduce((acc, s) => acc + s.apy, 0) / strategiesByType.yield.length 
            : 0,
          topTvL: strategiesByType.yield.sort((a, b) => b.tvl - a.tvl)[0],
        },
      },
    };
  }
}

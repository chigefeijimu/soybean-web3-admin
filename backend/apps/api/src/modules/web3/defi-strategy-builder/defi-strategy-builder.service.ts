import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'yield_farming' | 'staking' | 'lending' | 'liquidity' | 'arbitrage' | 'rebalancing';
  chains: string[];
  protocols: string[];
  parameters: StrategyParameters;
  riskLevel: 'low' | 'medium' | 'high';
  expectedApy: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface StrategyParameters {
  inputToken: string;
  outputToken: string;
  amount: number;
  slippageTolerance: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  stopLoss?: number;
  takeProfit?: number;
  autoCompound: boolean;
}

export interface StrategyBacktestResult {
  strategyId: string;
  period: string;
  totalReturn: number;
  apy: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  trades: number;
  dataPoints: { date: string; value: number }[];
}

@Injectable()
export class DefiStrategyBuilderService {
  private readonly strategies: Map<string, Strategy> = new Map();
  private readonly results: Map<string, StrategyBacktestResult[]> = new Map();

  constructor(private readonly httpService: HttpService) {
    this.initializeSampleStrategies();
  }

  private initializeSampleStrategies() {
    const samples: Strategy[] = [
      {
        id: 'strategy-001',
        name: 'ETH Staking Yield Optimizer',
        description: 'Stake ETH and auto-compound rewards using Lido',
        type: 'staking',
        chains: ['ethereum'],
        protocols: ['lido', 'rocket-pool'],
        parameters: {
          inputToken: 'ETH',
          outputToken: 'stETH',
          amount: 1,
          slippageTolerance: 0.5,
          frequency: 'daily',
          autoCompound: true,
        },
        riskLevel: 'low',
        expectedApy: 4.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      },
      {
        id: 'strategy-002',
        name: 'USDC Lending Strategy',
        description: 'Lend USDC on Aave for stable yields',
        type: 'lending',
        chains: ['ethereum', 'polygon'],
        protocols: ['aave', 'compound'],
        parameters: {
          inputToken: 'USDC',
          outputToken: 'aUSDC',
          amount: 10000,
          slippageTolerance: 0.3,
          frequency: 'weekly',
          autoCompound: true,
        },
        riskLevel: 'low',
        expectedApy: 5.2,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      },
      {
        id: 'strategy-003',
        name: 'Uniswap V3 Liquidity Mining',
        description: 'Provide liquidity to ETH/USDC pool and farm UNI',
        type: 'liquidity',
        chains: ['ethereum', 'arbitrum'],
        protocols: ['uniswap-v3'],
        parameters: {
          inputToken: 'ETH',
          outputToken: 'UNI',
          amount: 2,
          slippageTolerance: 1.0,
          frequency: 'monthly',
          stopLoss: 15,
          takeProfit: 50,
          autoCompound: false,
        },
        riskLevel: 'medium',
        expectedApy: 25.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      },
    ];

    samples.forEach(s => this.strategies.set(s.id, s));
  }

  async getAllStrategies(): Promise<Strategy[]> {
    return Array.from(this.strategies.values());
  }

  async getStrategyById(id: string): Promise<Strategy | null> {
    return this.strategies.get(id) || null;
  }

  async createStrategy(data: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Strategy> {
    const strategy: Strategy = {
      ...data,
      id: `strategy-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.strategies.set(strategy.id, strategy);
    return strategy;
  }

  async updateStrategy(id: string, data: Partial<Strategy>): Promise<Strategy | null> {
    const existing = this.strategies.get(id);
    if (!existing) return null;

    const updated: Strategy = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date(),
    };
    this.strategies.set(id, updated);
    return updated;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    return this.strategies.delete(id);
  }

  async runBacktest(id: string, period: '7d' | '30d' | '90d' | '1y'): Promise<StrategyBacktestResult> {
    const strategy = this.strategies.get(id);
    if (!strategy) throw new Error('Strategy not found');

    // Simulate backtest results based on strategy type and parameters
    const periodDays = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period];
    const periods = Math.floor(periodDays / 7);
    
    const dataPoints = [];
    let value = strategy.parameters.amount;
    for (let i = 0; i < periods; i++) {
      const weeklyReturn = (strategy.expectedApy / 52) * (0.8 + Math.random() * 0.4);
      value = value * (1 + weeklyReturn / 100);
      dataPoints.push({
        date: new Date(Date.now() - (periods - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Number(value.toFixed(2)),
      });
    }

    const totalReturn = ((value - strategy.parameters.amount) / strategy.parameters.amount) * 100;
    const result: StrategyBacktestResult = {
      strategyId: id,
      period,
      totalReturn: Number(totalReturn.toFixed(2)),
      apy: strategy.expectedApy,
      maxDrawdown: Math.random() * 15 + 5,
      sharpeRatio: Math.random() * 2 + 0.5,
      winRate: Math.random() * 30 + 60,
      trades: Math.floor(Math.random() * 20 + 5),
      dataPoints,
    };

    const existingResults = this.results.get(id) || [];
    existingResults.push(result);
    this.results.set(id, existingResults);

    return result;
  }

  async getBacktestHistory(id: string): Promise<StrategyBacktestResult[]> {
    return this.results.get(id) || [];
  }

  async getStrategyTemplates(): Promise<any[]> {
    return [
      {
        id: 'template-yield-farm',
        name: 'Yield Farming',
        description: 'Deposit tokens into farms to earn rewards',
        icon: '🌾',
        protocols: ['uniswap', 'sushiswap', 'curve'],
        riskLevel: 'high',
        complexity: 'medium',
      },
      {
        id: 'template-lending',
        name: 'Lending',
        description: 'Lend assets to earn interest',
        icon: '🏦',
        protocols: ['aave', 'compound', 'morpho'],
        riskLevel: 'low',
        complexity: 'low',
      },
      {
        id: 'template-staking',
        name: 'Staking',
        description: 'Stake tokens to secure network and earn rewards',
        icon: '🔒',
        protocols: ['lido', 'rocket-pool', 'ssv'],
        riskLevel: 'low',
        complexity: 'low',
      },
      {
        id: 'template-liquidity',
        name: 'Liquidity Provision',
        description: 'Provide liquidity to trading pairs',
        icon: '💧',
        protocols: ['uniswap-v3', 'balancer', 'curve'],
        riskLevel: 'medium',
        complexity: 'high',
      },
      {
        id: 'template-rebalancing',
        name: 'Portfolio Rebalancing',
        description: 'Automatically rebalance portfolio allocation',
        icon: '⚖️',
        protocols: ['token-sets', 'index-coop'],
        riskLevel: 'medium',
        complexity: 'medium',
      },
      {
        id: 'template-arbitrage',
        name: 'Arbitrage',
        description: 'Profit from price differences across DEXs',
        icon: '🔄',
        protocols: ['uniswap', 'sushiswap', 'curve'],
        riskLevel: 'high',
        complexity: 'very-high',
      },
    ];
  }

  async getAvailableChains(): Promise<string[]> {
    return ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
  }

  async getAvailableProtocols(chain?: string): Promise<any[]> {
    const allProtocols = {
      ethereum: ['aave', 'compound', 'uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve', 'lido', 'yearn', 'balancer', 'morpho'],
      polygon: ['aave', 'quickSwap', 'sushi', 'curve', 'yearn', 'balancer'],
      arbitrum: ['aave', 'uniswap-v3', 'sushi', 'curve', 'yearn', 'balancer', 'gmx'],
      optimism: ['aave', 'uniswap-v3', 'sushi', 'curve', 'velodrome', 'yearn'],
      bsc: ['venus', 'pancakeSwap', 'biswap', 'yearn', 'curve'],
      base: ['aave', 'uniswap-v3', 'sushi', 'curve', 'aerodrome'],
      avalanche: ['aave', 'trader-joe', 'curve', 'yearn', 'benqi'],
    };
    return chain ? (allProtocols[chain] || []).map(p => ({ name: p, chain })) : Object.entries(allProtocols).flatMap(([chain, protocols]) => 
      protocols.map(p => ({ name: p, chain }))
    );
  }

  async analyzeStrategyRisk(id: string): Promise<any> {
    const strategy = this.strategies.get(id);
    if (!strategy) throw new Error('Strategy not found');

    const riskFactors = [];
    let riskScore = 0;

    // Check protocol diversity
    if (strategy.protocols.length < 2) {
      riskFactors.push({ factor: 'Low protocol diversification', impact: 'high', score: 20 });
      riskScore += 20;
    }

    // Check chain diversification
    if (strategy.chains.length < 2) {
      riskFactors.push({ factor: 'Single chain exposure', impact: 'medium', score: 15 });
      riskScore += 15;
    }

    // Check stop loss
    if (!strategy.parameters.stopLoss && strategy.riskLevel !== 'low') {
      riskFactors.push({ factor: 'No stop loss configured', impact: 'high', score: 25 });
      riskScore += 25;
    }

    // Check auto-compound for high yield strategies
    if (strategy.expectedApy > 20 && !strategy.parameters.autoCompound) {
      riskFactors.push({ factor: 'High APY without auto-compound', impact: 'medium', score: 10 });
      riskScore += 10;
    }

    // Check slippage tolerance
    if (strategy.parameters.slippageTolerance > 2) {
      riskFactors.push({ factor: 'High slippage tolerance', impact: 'medium', score: 15 });
      riskScore += 15;
    }

    const riskLevel = riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low';

    return {
      strategyId: id,
      overallRiskScore: Math.min(riskScore, 100),
      riskLevel,
      riskFactors,
      recommendations: this.getRecommendations(riskLevel, strategy),
    };
  }

  private getRecommendations(riskLevel: string, strategy: Strategy): string[] {
    const recommendations = [];
    
    if (strategy.protocols.length < 2) {
      recommendations.push('Consider diversifying across multiple protocols to reduce smart contract risk');
    }
    if (strategy.chains.length < 2) {
      recommendations.push('Multi-chain deployment can reduce chain-specific risks');
    }
    if (!strategy.parameters.stopLoss) {
      recommendations.push('Setting a stop loss can prevent significant losses in volatile markets');
    }
    if (strategy.parameters.slippageTolerance > 1) {
      recommendations.push('Lower slippage tolerance protects against MEV and front-running');
    }
    if (strategy.expectedApy > 50) {
      recommendations.push('Extremely high APY strategies often carry impermanent loss or smart contract risks');
    }

    return recommendations;
  }
}

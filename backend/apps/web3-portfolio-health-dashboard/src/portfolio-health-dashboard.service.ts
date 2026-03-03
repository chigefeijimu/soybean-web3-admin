import { Injectable } from '@nestjs/common';

export interface ChainPortfolio {
  chain: string;
  totalValue: number;
  tokens: number;
  tokensList: TokenInfo[];
}

export interface TokenInfo {
  symbol: string;
  balance: number;
  value: number;
  percentage: number;
  category: 'stablecoin' | 'defi' | 'layer1' | 'nft' | 'other';
  risk: 'low' | 'medium' | 'high';
}

export interface PortfolioHealthScore {
  overall: number;
  diversification: number;
  riskManagement: number;
  gasEfficiency: number;
  concentration: number;
  liquidity: number;
}

export interface HealthAnalysis {
  score: PortfolioHealthScore;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  chainDistribution: ChainPortfolio[];
  recommendations: Recommendation[];
  alerts: Alert[];
  metrics: PortfolioMetrics;
}

export interface Recommendation {
  type: 'rebalance' | 'diversify' | 'reduce_risk' | 'optimize_gas' | 'add_liquidity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialImpact: string;
  estimatedBenefit: number;
}

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  chain?: string;
  token?: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalChains: number;
  totalTokens: number;
  stablecoinRatio: number;
  defiRatio: number;
  topTokenConcentration: number;
  avgTransactionGas: number;
  lastActivity: string;
  volatilityScore: number;
}

@Injectable()
export class PortfolioHealthDashboardService {
  private supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche',
    'solana', 'zksync', 'starknet', 'linea', 'scroll', 'mantle'
  ];

  private riskWeights = {
    stablecoin: 0.2,
    layer1: 0.5,
    defi: 0.7,
    nft: 0.9,
    other: 0.6
  };

  async analyzePortfolio(address: string): Promise<HealthAnalysis> {
    const chainData = await this.fetchCrossChainPortfolio(address);
    const score = this.calculateHealthScore(chainData);
    const recommendations = this.generateRecommendations(chainData, score);
    const alerts = this.generateAlerts(chainData, score);
    
    return {
      score,
      riskLevel: this.determineRiskLevel(score),
      summary: this.generateSummary(score),
      chainDistribution: chainData,
      recommendations,
      alerts,
      metrics: this.calculateMetrics(chainData)
    };
  }

  private async fetchCrossChainPortfolio(address: string): Promise<ChainPortfolio[]> {
    // Simulate fetching portfolio data from multiple chains
    const chainValues = this.generateMockPortfolioData();
    return chainValues;
  }

  private generateMockPortfolioData(): ChainPortfolio[] {
    const chains = this.supportedChains.slice(0, 7);
    const categories: Array<'stablecoin' | 'defi' | 'layer1' | 'nft' | 'other'> = 
      ['stablecoin', 'defi', 'layer1', 'nft', 'other'];
    
    return chains.map(chain => {
      const totalValue = Math.random() * 50000 + 1000;
      const tokenCount = Math.floor(Math.random() * 8) + 2;
      const tokens: TokenInfo[] = [];
      
      for (let i = 0; i < tokenCount; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const value = (totalValue / tokenCount) * (0.5 + Math.random());
        tokens.push({
          symbol: this.getRandomTokenSymbol(category),
          balance: Math.random() * 100,
          value,
          percentage: (value / totalValue) * 100,
          category,
          risk: this.getRiskLevel(category)
        });
      }

      return {
        chain,
        totalValue,
        tokens: tokenCount,
        tokensList: tokens
      };
    });
  }

  private getRandomTokenSymbol(category: string): string {
    const tokensByCategory: Record<string, string[]> = {
      stablecoin: ['USDC', 'USDT', 'DAI', 'FRAX', 'BUSD'],
      defi: ['UNI', 'AAVE', 'CRV', 'MKR', 'COMP', 'SNX'],
      layer1: ['ETH', 'BNB', 'MATIC', 'AVAX', 'SOL', 'ARB'],
      nft: ['NFT', 'PUNK', 'AZUKI', 'BAYC'],
      other: ['LINK', 'DOT', 'ATOM', 'MATIC']
    };
    const tokens = tokensByCategory[category] || tokensByCategory.other;
    return tokens[Math.floor(Math.random() * tokens.length)];
  }

  private getRiskLevel(category: string): 'low' | 'medium' | 'high' {
    if (category === 'stablecoin') return 'low';
    if (category === 'layer1') return 'medium';
    return 'high';
  }

  private calculateHealthScore(chains: ChainPortfolio[]): PortfolioHealthScore {
    const totalValue = chains.reduce((sum, c) => sum + c.totalValue, 0);
    
    // Diversification score
    const chainCount = chains.length;
    const diversification = Math.min(100, (chainCount / 7) * 100);

    // Risk management score
    let riskSum = 0;
    let tokenCount = 0;
    chains.forEach(chain => {
      chain.tokensList.forEach(token => {
        riskSum += this.riskWeights[token.category] * token.percentage;
        tokenCount++;
      });
    });
    const riskManagement = Math.max(0, 100 - (riskSum / tokenCount) * 100);

    // Gas efficiency score (based on chain diversity and transaction patterns)
    const gasEfficiency = 60 + Math.random() * 30;

    // Concentration score
    let maxConcentration = 0;
    chains.forEach(chain => {
      chain.tokensList.forEach(token => {
        if (token.percentage > maxConcentration) {
          maxConcentration = token.value / totalValue * 100;
        }
      });
    });
    const concentration = Math.max(0, 100 - maxConcentration * 2);

    // Liquidity score
    const stablecoinRatio = chains.reduce((sum, chain) => {
      const scValue = chain.tokensList
        .filter(t => t.category === 'stablecoin')
        .reduce((s, t) => s + t.value, 0);
      return sum + scValue;
    }, 0) / totalValue;
    const liquidity = stablecoinRatio * 100;

    return {
      overall: Math.round((diversification * 0.2 + riskManagement * 0.25 + gasEfficiency * 0.15 + concentration * 0.2 + liquidity * 0.2)),
      diversification: Math.round(diversification),
      riskManagement: Math.round(riskManagement),
      gasEfficiency: Math.round(gasEfficiency),
      concentration: Math.round(concentration),
      liquidity: Math.round(liquidity)
    };
  }

  private determineRiskLevel(score: PortfolioHealthScore): 'low' | 'medium' | 'high' | 'critical' {
    if (score.overall >= 80) return 'low';
    if (score.overall >= 60) return 'medium';
    if (score.overall >= 40) return 'high';
    return 'critical';
  }

  private generateSummary(score: PortfolioHealthScore): string {
    if (score.overall >= 80) {
      return 'Excellent portfolio health! Your investments are well-diversified across chains with good risk management.';
    } else if (score.overall >= 60) {
      return 'Good portfolio health. Consider diversifying further and optimizing gas efficiency.';
    } else if (score.overall >= 40) {
      return 'Portfolio needs attention. High concentration risk and limited diversification detected.';
    } else {
      return 'Critical: Portfolio requires immediate rebalancing. Significant risks identified.';
    }
  }

  private generateRecommendations(chains: ChainPortfolio[], score: PortfolioHealthScore): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const totalValue = chains.reduce((sum, c) => sum + c.totalValue, 0);

    // Diversification recommendation
    if (score.diversification < 50) {
      recommendations.push({
        type: 'diversify',
        priority: 'high',
        title: 'Expand Chain Diversity',
        description: 'Your portfolio is concentrated on fewer chains. Consider spreading investments across more chains.',
        potentialImpact: 'Reduce single-chain risk by 30%',
        estimatedBenefit: totalValue * 0.05
      });
    }

    // Risk management recommendation
    if (score.riskManagement < 50) {
      recommendations.push({
        type: 'reduce_risk',
        priority: 'high',
        title: 'Reduce High-Risk Exposures',
        description: 'Consider reducing exposure to high-risk categories like NFTs and speculative DeFi tokens.',
        potentialImpact: 'Lower portfolio volatility by 25%',
        estimatedBenefit: totalValue * 0.08
      });
    }

    // Gas optimization recommendation
    if (score.gasEfficiency < 70) {
      recommendations.push({
        type: 'optimize_gas',
        priority: 'medium',
        title: 'Optimize Gas Usage',
        description: 'Consider consolidating transactions and using Layer 2 networks for better gas efficiency.',
        potentialImpact: 'Save up to 40% on gas costs',
        estimatedBenefit: totalValue * 0.02
      });
    }

    // Concentration recommendation
    if (score.concentration < 60) {
      recommendations.push({
        type: 'rebalance',
        priority: 'high',
        title: 'Reduce Token Concentration',
        description: 'Top tokens represent too large a portion of portfolio. Consider rebalancing.',
        potentialImpact: 'Reduce single-point failure risk',
        estimatedBenefit: totalValue * 0.03
      });
    }

    // Liquidity recommendation
    if (score.liquidity < 30) {
      recommendations.push({
        type: 'add_liquidity',
        priority: 'medium',
        title: 'Add Stablecoin Buffer',
        description: 'Low stablecoin ratio may affect ability to handle market volatility.',
        potentialImpact: 'Improve crisis response capability',
        estimatedBenefit: totalValue * 0.04
      });
    }

    return recommendations.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });
  }

  private generateAlerts(chains: ChainPortfolio[], score: PortfolioHealthScore): Alert[] {
    const alerts: Alert[] = [];

    // High concentration alert
    chains.forEach(chain => {
      chain.tokensList.forEach(token => {
        if (token.percentage > 40) {
          alerts.push({
            type: 'danger',
            message: `High concentration: ${token.symbol} represents ${token.percentage.toFixed(1)}% of portfolio`,
            chain: chain.chain,
            token: token.symbol
          });
        }
      });
    });

    // Low diversification alert
    if (chains.length < 3) {
      alerts.push({
        type: 'warning',
        message: 'Portfolio spans fewer than 3 chains - high concentration risk'
      });
    }

    // NFT risk alert
    const nftRatio = chains.reduce((sum, chain) => {
      const nftValue = chain.tokensList
        .filter(t => t.category === 'nft')
        .reduce((s, t) => s + t.value, 0);
      return sum + nftValue;
    }, 0) / chains.reduce((sum, c) => sum + c.totalValue, 0);

    if (nftRatio > 0.3) {
      alerts.push({
        type: 'warning',
        message: `High NFT exposure (${(nftRatio * 100).toFixed(1)}%) - consider reducing for better risk management`
      });
    }

    return alerts;
  }

  private calculateMetrics(chains: ChainPortfolio[]): PortfolioMetrics {
    const totalValue = chains.reduce((sum, c) => sum + c.totalValue, 0);
    
    const stablecoinValue = chains.reduce((sum, chain) => {
      return sum + chain.tokensList
        .filter(t => t.category === 'stablecoin')
        .reduce((s, t) => s + t.value, 0);
    }, 0);

    const defiValue = chains.reduce((sum, chain) => {
      return sum + chain.tokensList
        .filter(t => t.category === 'defi')
        .reduce((s, t) => s + t.value, 0);
    }, 0);

    const totalTokens = chains.reduce((sum, c) => sum + c.tokens, 0);

    let maxTokenValue = 0;
    chains.forEach(chain => {
      chain.tokensList.forEach(token => {
        if (token.value > maxTokenValue) {
          maxTokenValue = token.value;
        }
      });
    });

    return {
      totalValue,
      totalChains: chains.length,
      totalTokens,
      stablecoinRatio: stablecoinValue / totalValue,
      defiRatio: defiValue / totalValue,
      topTokenConcentration: maxTokenValue / totalValue,
      avgTransactionGas: 15 + Math.random() * 20,
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      volatilityScore: 30 + Math.random() * 40
    };
  }

  // Get health trends over time
  async getHealthTrends(address: string, days: number = 30): Promise<any[]> {
    const trends = [];
    const now = Date.now();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split('T')[0],
        overall: 50 + Math.random() * 40,
        diversification: 40 + Math.random() * 40,
        riskManagement: 45 + Math.random() * 40,
        gasEfficiency: 50 + Math.random() * 30,
        concentration: 40 + Math.random() * 40,
        liquidity: 35 + Math.random() * 45
      });
    }
    
    return trends;
  }

  // Compare two portfolios
  async comparePortfolios(address1: string, address2: string): Promise<any> {
    const health1 = await this.analyzePortfolio(address1);
    const health2 = await this.analyzePortfolio(address2);
    
    return {
      portfolio1: {
        address: address1,
        score: health1.score.overall,
        totalValue: health1.metrics.totalValue,
        riskLevel: health1.riskLevel
      },
      portfolio2: {
        address: address2,
        score: health2.score.overall,
        totalValue: health2.metrics.totalValue,
        riskLevel: health2.riskLevel
      },
      comparison: {
        healthScoreDiff: health1.score.overall - health2.score.overall,
        valueDiff: health1.metrics.totalValue - health2.metrics.totalValue,
        winner: health1.score.overall > health2.score.overall ? 'portfolio1' : 'portfolio2'
      }
    };
  }

  // Get recommended rebalancing strategy
  async getRebalancingStrategy(address: string, targetChains?: string[]): Promise<any> {
    const portfolio = await this.analyzePortfolio(address);
    const totalValue = portfolio.metrics.totalValue;
    
    // Default target distribution
    const targetDistribution = targetChains || [
      { chain: 'ethereum', target: 30 },
      { chain: 'arbitrum', target: 20 },
      { chain: 'optimism', target: 15 },
      { chain: 'polygon', target: 15 },
      { chain: 'avalanche', target: 10 },
      { chain: 'bsc', target: 10 }
    ];

    const currentDistribution = portfolio.chainDistribution.map(c => ({
      chain: c.chain,
      current: (c.totalValue / totalValue) * 100,
      target: targetDistribution.find(t => t.chain === c.chain)?.target || 0
    }));

    const rebalancingActions = currentDistribution.map(c => {
      const diff = c.target - c.current;
      return {
        chain: c.chain,
        currentPercent: c.current,
        targetPercent: c.target,
        difference: diff,
        action: diff > 5 ? (diff > 0 ? 'increase' : 'decrease') : 'hold',
        amount: Math.abs(diff / 100 * totalValue)
      };
    }).filter(a => Math.abs(a.difference) > 5);

    return {
      totalPortfolioValue: totalValue,
      targetDistribution,
      currentDistribution,
      rebalancingActions,
      estimatedGasCost: rebalancingActions.length * 20,
      recommendations: portfolio.recommendations.filter(r => r.type === 'rebalance' || r.type === 'diversify')
    };
  }
}

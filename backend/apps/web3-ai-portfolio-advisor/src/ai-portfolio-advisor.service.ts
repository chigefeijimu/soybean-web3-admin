import { Injectable } from '@nestjs/common';

export interface PortfolioAnalysis {
  overview: {
    totalValue: number;
    change24h: number;
    changePercent24h: number;
    tokens: number;
    chains: number;
  };
  allocation: {
    category: string;
    value: number;
    percentage: number;
  }[];
  riskScore: number;
  riskLevel: string;
  diversification: {
    score: number;
    rating: string;
    suggestions: string[];
  };
  performance: {
    return1d: number;
    return7d: number;
    return30d: number;
    volatility: string;
  };
  holdings: {
    symbol: string;
    value: number;
    chain: string;
    category: string;
  }[];
  recommendations: string[];
  timestamp: number;
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
}

export interface Optimization {
  current: { category: string; percentage: number }[];
  suggested: { category: string; percentage: number }[];
  actions: {
    type: string;
    from: string;
    to: string;
    amount: number;
    reason: string;
  }[];
  expectedImprovement: number;
}

export interface Insight {
  type: 'opportunity' | 'risk' | 'tip' | 'info';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RiskAssessment {
  overallScore: number;
  level: string;
  factors: {
    name: string;
    score: number;
    weight: number;
    description: string;
  }[];
  mitigation: {
    risk: string;
    action: string;
    priority: string;
  }[];
}

export interface Opportunity {
  type: string;
  name: string;
  description: string;
  potential: string;
  risk: string;
  steps: string[];
}

@Injectable()
export class AiPortfolioAdvisorService {
  private readonly SUPPORTED_CHAINS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];

  private readonly CATEGORY_KEYWORDS: Record<string, string[]> = {
    'Stablecoins': ['USDC', 'USDT', 'DAI', 'TUSD', 'BUSD', 'FRAX', 'USDP', 'MIM'],
    'Layer1': ['ETH', 'BTC', 'SOL', 'BNB', 'AVAX', 'MATIC', 'ARB', 'OP'],
    'DeFi': ['UNI', 'AAVE', 'COMP', 'CRV', 'MKR', 'SUSHI', 'LDO', 'SNX', 'YFI', 'BAL', 'LQTY'],
    'NFT': ['NFT', 'PUNK', 'AZUKI', 'BAYC', 'DOODLE', 'CLONEX'],
    'Governance': ['DAO', 'GOV', 'VOTE'],
  };

  private readonly RISK_TOKENS = ['YFI', 'CRV', 'SNX', 'LDO', 'MKR', 'AAVE'];

  healthCheck() {
    return {
      status: 'healthy',
      service: 'AI Portfolio Advisor',
      version: '1.0.0',
      timestamp: Date.now(),
    };
  }

  async analyzePortfolio(address: string, chain: string): Promise<PortfolioAnalysis> {
    // Simulate portfolio data based on address
    const holdings = this.generateMockHoldings(address);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    
    // Calculate allocation by category
    const allocation = this.calculateAllocation(holdings);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(holdings, totalValue);
    
    // Calculate diversification
    const diversification = this.calculateDiversification(holdings, totalValue);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(holdings, allocation, riskScore, diversification);
    
    // Calculate performance metrics
    const performance = this.calculatePerformance(totalValue);

    return {
      overview: {
        totalValue,
        change24h: totalValue * (Math.random() * 0.1 - 0.05),
        changePercent24h: (Math.random() * 10 - 5),
        tokens: holdings.length,
        chains: [...new Set(holdings.map(h => h.chain))].length,
      },
      allocation,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      diversification,
      performance,
      holdings: holdings.slice(0, 20),
      recommendations,
      timestamp: Date.now(),
    };
  }

  async getRecommendations(address: string, riskTolerance: string, goal: string): Promise<{
    recommendations: Recommendation[];
    summary: string;
    nextSteps: string[];
  }> {
    const holdings = this.generateMockHoldings(address);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const allocation = this.calculateAllocation(holdings);

    const recommendations: Recommendation[] = [];

    // Analyze diversification
    if (allocation.length < 3) {
      recommendations.push({
        category: 'Diversification',
        title: 'Improve Portfolio Diversification',
        description: 'Your portfolio is concentrated in few categories. Consider spreading across more DeFi protocols and asset classes.',
        priority: 'high',
        impact: 'Reduce risk by 20-30%',
        effort: 'Medium - Requires research',
      });
    }

    // Analyze stablecoin ratio
    const stablecoinRatio = allocation.find(a => a.category === 'Stablecoins')?.percentage || 0;
    if (stablecoinRatio < 5 && riskTolerance === 'conservative') {
      recommendations.push({
        category: 'Stability',
        title: 'Increase Stablecoin Allocation',
        description: 'Based on your conservative risk tolerance, consider adding more stablecoins for capital preservation.',
        priority: 'high',
        impact: 'Reduce volatility significantly',
        effort: 'Low - Easy swap',
      });
    }

    // Check for high-risk tokens
    const highRiskHoldings = holdings.filter(h => this.RISK_TOKENS.includes(h.symbol));
    if (highRiskHoldings.length > 0 && riskTolerance === 'conservative') {
      recommendations.push({
        category: 'Risk Management',
        title: 'Review High-Risk Positions',
        description: `You hold ${highRiskHoldings.length} high-risk tokens (${highRiskHoldings.map(h => h.symbol).join(', ')}). Consider reducing exposure.`,
        priority: 'medium',
        impact: 'Reduce potential losses',
        effort: 'Low - Monitor only',
      });
    }

    // DeFi opportunities
    if (!allocation.find(a => a.category === 'DeFi')) {
      recommendations.push({
        category: 'Yield',
        title: 'Explore DeFi Yield Opportunities',
        description: 'Your portfolio has no DeFi exposure. Consider lending or staking for yield generation.',
        priority: 'medium',
        impact: 'Generate 3-10% APY',
        effort: 'Medium - Requires protocol interaction',
      });
    }

    // Goal-based recommendations
    if (goal === 'income') {
      recommendations.push({
        category: 'Income',
        title: 'Optimize for Income Generation',
        description: 'Consider staking positions, lending protocols, and dividend-yielding tokens for regular income.',
        priority: 'high',
        impact: 'Generate 5-15% yield',
        effort: 'Medium',
      });
    } else if (goal === 'growth') {
      recommendations.push({
        category: 'Growth',
        title: 'Focus on Growth Assets',
        description: 'Consider increasing allocation to Layer1 tokens and emerging DeFi protocols for maximum growth potential.',
        priority: 'medium',
        impact: 'Higher long-term returns',
        effort: 'High - Requires active management',
      });
    }

    // Add general recommendations
    recommendations.push({
      category: 'Optimization',
      title: 'Gas Fee Optimization',
      description: 'Consider batching transactions or using Layer2 networks to reduce gas costs.',
      priority: 'low',
      impact: 'Save 50-80% on fees',
      effort: 'Low',
    });

    return {
      recommendations,
      summary: `Based on your ${riskTolerance} risk tolerance and ${goal} goal, I recommend ${recommendations.length} actions to optimize your portfolio.`,
      nextSteps: [
        'Review the recommendations above',
        'Start with high-priority items',
        'Monitor portfolio weekly',
        'Rebalance quarterly',
      ],
    };
  }

  async optimizePortfolio(address: string, targetAllocation?: string): Promise<Optimization> {
    const holdings = this.generateMockHoldings(address);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const currentAllocation = this.calculateAllocation(holdings);

    // Default target allocation based on moderate risk
    const suggestedAllocation = [
      { category: 'Stablecoins', percentage: 15 },
      { category: 'Layer1', percentage: 40 },
      { category: 'DeFi', percentage: 30 },
      { category: 'NFT', percentage: 10 },
      { category: 'Governance', percentage: 5 },
    ];

    const actions = this.calculateRebalancingActions(currentAllocation, suggestedAllocation, totalValue);

    return {
      current: currentAllocation,
      suggested: suggestedAllocation,
      actions,
      expectedImprovement: 15.5,
    };
  }

  async getInsights(address: string): Promise<{
    insights: Insight[];
    summary: string;
  }> {
    const holdings = this.generateMockHoldings(address);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const insights: Insight[] = [];

    // Check for concentration risk
    const topHolding = holdings.reduce((max, h) => h.value > max.value ? h : max, holdings[0]);
    if (topHolding.value / totalValue > 0.5) {
      insights.push({
        type: 'risk',
        title: 'High Concentration Risk',
        description: `${topHolding.symbol} represents over 50% of your portfolio. Consider diversifying.`,
        severity: 'high',
      });
    }

    // Check for stablecoin opportunities
    const stablecoins = holdings.filter(h => h.category === 'Stablecoins');
    if (stablecoins.length === 0) {
      insights.push({
        type: 'opportunity',
        title: 'Yield Opportunity',
        description: 'No stablecoins found. Consider adding USDC/DAI to earn yield while waiting for opportunities.',
        severity: 'medium',
      });
    }

    // Check gas efficiency
    const chains = [...new Set(holdings.map(h => h.chain))];
    if (chains.length > 1) {
      insights.push({
        type: 'tip',
        title: 'Cross-chain Diversification',
        description: `Great job diversifying across ${chains.length} chains! This reduces network-specific risks.`,
        severity: 'low',
      });
    }

    // Check DeFi exposure
    const defiHoldings = holdings.filter(h => h.category === 'DeFi');
    if (defiHoldings.length > 3) {
      insights.push({
        type: 'info',
        title: 'Strong DeFi Presence',
        description: `You have ${defiHoldings.length} DeFi positions. Consider consolidating to reduce complexity.`,
        severity: 'low',
      });
    }

    // General market insight
    insights.push({
      type: 'info',
      title: 'Market Context',
      description: 'Current market conditions suggest moderate volatility. Consider maintaining current positions.',
      severity: 'low',
    });

    return {
      insights,
      summary: `Found ${insights.length} insights for your portfolio.`,
    };
  }

  async getRiskAssessment(address: string): Promise<RiskAssessment> {
    const holdings = this.generateMockHoldings(address);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    
    const factors = [
      {
        name: 'Concentration Risk',
        score: this.calculateConcentrationRisk(holdings, totalValue),
        weight: 0.25,
        description: 'Portfolio concentration across assets',
      },
      {
        name: 'Counterparty Risk',
        score: this.calculateCounterpartyRisk(holdings),
        weight: 0.20,
        description: 'Exposure to individual protocols',
      },
      {
        name: 'Liquidity Risk',
        score: this.calculateLiquidityRisk(holdings),
        weight: 0.20,
        description: 'Ability to exit positions quickly',
      },
      {
        name: 'Market Risk',
        score: this.calculateMarketRisk(holdings),
        weight: 0.20,
        description: 'Overall market volatility exposure',
      },
      {
        name: 'Operational Risk',
        score: 75,
        weight: 0.15,
        description: 'Smart contract and platform risks',
      },
    ];

    const overallScore = Math.round(
      factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    );

    const mitigation = [
      {
        risk: 'High concentration',
        action: 'Rebalance to reduce single asset exposure',
        priority: 'high',
      },
      {
        risk: 'Limited diversification',
        action: 'Add positions in different categories',
        priority: 'medium',
      },
      {
        risk: 'Smart contract exposure',
        action: 'Limit exposure to any single protocol to 20%',
        priority: 'medium',
      },
    ];

    return {
      overallScore,
      level: this.getRiskLevel(overallScore),
      factors,
      mitigation,
    };
  }

  async getOpportunities(address: string): Promise<{
    opportunities: Opportunity[];
  }> {
    const holdings = this.generateMockHoldings(address);
    const opportunities: Opportunity[] = [];

    // Check for staking opportunities
    const hasETH = holdings.some(h => h.symbol === 'ETH' && h.chain === 'ethereum');
    if (hasETH) {
      opportunities.push({
        type: 'Staking',
        name: 'ETH Liquid Staking',
        description: 'Stake ETH to LDO or RPL for 4-8% APY while maintaining liquidity',
        potential: '5-8% APY',
        risk: 'Medium - Smart contract risk',
        steps: [
          '1. Navigate to Lido or Rocket Pool',
          '2. Connect wallet',
          '3. Stake ETH',
          '4. Receive stETH/rETH',
        ],
      });
    }

    // Check for lending opportunities
    const hasStablecoins = holdings.some(h => h.category === 'Stablecoins');
    if (hasStablecoins) {
      opportunities.push({
        type: 'Lending',
        name: 'Supply Stablecoins to Aave',
        description: 'Earn passive income by supplying stablecoins to Aave V3',
        potential: '4-6% APY',
        risk: 'Low - Well-audited protocol',
        steps: [
          '1. Go to app.aave.com',
          '2. Connect wallet',
          '3. Select Supply',
          '4. Choose stablecoin',
          '5. Confirm transaction',
        ],
      });
    }

    // Check for DAO governance opportunities
    if (!holdings.some(h => h.category === 'Governance')) {
      opportunities.push({
        type: 'Governance',
        name: 'Join DAO Governance',
        description: 'Acquire governance tokens to participate in protocol decision-making',
        potential: 'Influence + Potential airdrops',
        risk: 'Medium - Token volatility',
        steps: [
          '1. Research DAOs (Uniswap, Aave, Compound)',
          '2. Acquire governance tokens',
          '3. Delegate voting power',
          '4. Participate in proposals',
        ],
      });
    }

    // Cross-chain opportunities
    const chains = [...new Set(holdings.map(h => h.chain))];
    if (chains.length < 3) {
      opportunities.push({
        type: 'Cross-chain',
        name: 'Explore Layer2 Networks',
        description: 'Explore Arbitrum or Optimism for lower fees and DeFi opportunities',
        potential: '30-50% gas savings + yields',
        risk: 'Medium - Bridge risk',
        steps: [
          '1. Bridge assets via LayerZero or Across',
          '2. Explore DeFi on L2',
          '3. Look for incentives',
        ],
      });
    }

    return { opportunities };
  }

  async comparePortfolios(address1: string, address2: string): Promise<{
    comparison: {
      metric: string;
      value1: number | string;
      value2: number | string;
      winner: string;
    }[];
    recommendation: string;
  }> {
    const portfolio1 = await this.analyzePortfolio(address1, 'ethereum');
    const portfolio2 = await this.analyzePortfolio(address2, 'ethereum');

    const comparison = [
      {
        metric: 'Total Value',
        value1: portfolio1.overview.totalValue,
        value2: portfolio2.overview.totalValue,
        winner: portfolio1.overview.totalValue > portfolio2.overview.totalValue ? 'Portfolio 1' : 'Portfolio 2',
      },
      {
        metric: 'Risk Score',
        value1: portfolio1.riskScore,
        value2: portfolio2.riskScore,
        winner: portfolio1.riskScore < portfolio2.riskScore ? 'Portfolio 1' : 'Portfolio 2',
      },
      {
        metric: 'Diversification',
        value1: portfolio1.diversification.score,
        value2: portfolio2.diversification.score,
        winner: portfolio1.diversification.score > portfolio2.diversification.score ? 'Portfolio 1' : 'Portfolio 2',
      },
      {
        metric: '7d Return',
        value1: portfolio1.performance.return7d,
        value2: portfolio2.performance.return7d,
        winner: portfolio1.performance.return7d > portfolio2.performance.return7d ? 'Portfolio 1' : 'Portfolio 2',
      },
      {
        metric: 'Token Count',
        value1: portfolio1.overview.tokens,
        value2: portfolio2.overview.tokens,
        winner: portfolio1.overview.tokens > portfolio2.overview.tokens ? 'Portfolio 1' : 'Portfolio 2',
      },
    ];

    return {
      comparison,
      recommendation: 'Both portfolios have different risk profiles. Consider combining best practices from both.',
    };
  }

  async getMarketContext(): Promise<{
    sentiment: string;
    volatility: string;
    trend: string;
    opportunities: string[];
    risks: string[];
  }> {
    return {
      sentiment: 'Neutral',
      volatility: 'Moderate',
      trend: 'Sideways',
      opportunities: [
        'DeFi lending rates are attractive for stablecoins',
        'Layer2 networks offer good yield opportunities',
        'Staking derivatives provide liquid yield',
      ],
      risks: [
        'Smart contract risk remains elevated',
        'Market volatility may increase',
        'Regulatory uncertainty persists',
      ],
    };
  }

  // Helper methods
  private generateMockHoldings(address: string): { symbol: string; value: number; chain: string; category: string }[] {
    // Generate deterministic but varied holdings based on address
    const seed = address.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const rng = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 * n;

    const tokens = [
      { symbol: 'ETH', chain: 'ethereum', category: 'Layer1' },
      { symbol: 'USDC', chain: 'ethereum', category: 'Stablecoins' },
      { symbol: 'USDT', chain: 'polygon', category: 'Stablecoins' },
      { symbol: 'UNI', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'AAVE', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'MATIC', chain: 'polygon', category: 'Layer1' },
      { symbol: 'ARB', chain: 'arbitrum', category: 'Layer1' },
      { symbol: 'OP', chain: 'optimism', category: 'Layer1' },
      { symbol: 'LDO', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'CRV', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'MKR', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'SNX', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'DAI', chain: 'ethereum', category: 'Stablecoins' },
      { symbol: 'LINK', chain: 'ethereum', category: 'DeFi' },
      { symbol: 'AVAX', chain: 'avalanche', category: 'Layer1' },
    ];

    return tokens.map((token, i) => ({
      ...token,
      value: Math.abs(rng(10000)) + 100,
    })).sort((a, b) => b.value - a.value);
  }

  private calculateAllocation(holdings: { symbol: string; value: number; category: string }[]) {
    const total = holdings.reduce((sum, h) => sum + h.value, 0);
    const categoryMap = new Map<string, number>();

    holdings.forEach(h => {
      const current = categoryMap.get(h.category) || 0;
      categoryMap.set(h.category, current + h.value);
    });

    return Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value,
      percentage: Math.round((value / total) * 100 * 10) / 10,
    })).sort((a, b) => b.value - a.value);
  }

  private calculateRiskScore(holdings: { symbol: string; category: string }[], totalValue: number): number {
    let score = 50; // Base score

    // Adjust for category
    holdings.forEach(h => {
      if (h.category === 'Stablecoins') score -= 2;
      if (h.category === 'DeFi') score += 3;
      if (h.category === 'NFT') score += 5;
    });

    // Adjust for high-risk tokens
    if (holdings.some(h => this.RISK_TOKENS.includes(h.symbol))) {
      score += 10;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private getRiskLevel(score: number): string {
    if (score < 30) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 70) return 'High';
    return 'Very High';
  }

  private calculateDiversification(holdings: { value: number }[], totalValue: number) {
    const count = holdings.length;
    let score = 30;

    if (count >= 5) score += 20;
    if (count >= 10) score += 20;
    if (count >= 20) score += 15;

    // Check for concentration
    const topHolding = holdings[0];
    if (topHolding && topHolding.value / totalValue > 0.5) {
      score -= 25;
    } else if (topHolding && topHolding.value / totalValue > 0.3) {
      score -= 10;
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      rating: score > 70 ? 'Excellent' : score > 50 ? 'Good' : score > 30 ? 'Fair' : 'Poor',
      suggestions: score < 50 ? ['Add more diverse assets', 'Reduce concentration in top holdings'] : [],
    };
  }

  private generateRecommendations(
    holdings: { symbol: string; category: string; value: number }[],
    allocation: { category: string; percentage: number }[],
    riskScore: number,
    diversification: { score: number }
  ): string[] {
    const recommendations: string[] = [];

    if (diversification.score < 50) {
      recommendations.push('Consider diversifying across more asset categories');
    }

    if (!allocation.find(a => a.category === 'Stablecoins')) {
      recommendations.push('Add stablecoins for portfolio stability');
    }

    if (!allocation.find(a => a.category === 'DeFi')) {
      recommendations.push('Explore DeFi opportunities for yield generation');
    }

    if (riskScore > 70) {
      recommendations.push('Consider reducing high-risk positions');
    }

    if (holdings.length < 5) {
      recommendations.push('Expand your portfolio with additional quality assets');
    }

    return recommendations;
  }

  private calculatePerformance(totalValue: number) {
    return {
      return1d: (Math.random() * 6 - 3),
      return7d: (Math.random() * 20 - 10),
      return30d: (Math.random() * 40 - 15),
      volatility: Math.random() > 0.5 ? 'High' : 'Moderate',
    };
  }

  private calculateRebalancingActions(
    current: { category: string; percentage: number }[],
    suggested: { category: string; percentage: number }[],
    totalValue: number
  ) {
    const actions = [];
    const currentMap = new Map(current.map(c => [c.category, c.percentage]));
    const suggestedMap = new Map(suggested.map(s => [s.category, s.percentage]));

    suggested.forEach(s => {
      const currentPct = currentMap.get(s.category) || 0;
      const diff = s.percentage - currentPct;

      if (Math.abs(diff) > 5) {
        const from = current.find(c => currentMap.get(c.category)! > s.percentage)?.category || 'Other';
        actions.push({
          type: diff > 0 ? 'Buy' : 'Sell',
          from: diff < 0 ? s.category : from,
          to: diff > 0 ? s.category : 'Other',
          amount: Math.abs((diff / 100) * totalValue),
          reason: `${diff > 0 ? 'Increase' : 'Decrease'} ${s.category} exposure`,
        });
      }
    });

    return actions.slice(0, 5);
  }

  private calculateConcentrationRisk(holdings: { value: number }[], totalValue: number): number {
    if (holdings.length === 0) return 100;
    const top10Value = holdings.slice(0, Math.min(10, holdings.length))
      .reduce((sum, h) => sum + h.value, 0);
    const concentration = top10Value / totalValue;
    return Math.round((1 - concentration) * 100);
  }

  private calculateCounterpartyRisk(holdings: { category: string }[]): number {
    const categories = new Set(holdings.map(h => h.category));
    return Math.max(20, 100 - categories.size * 15);
  }

  private calculateLiquidityRisk(holdings: { category: string }[]): number {
    const illiquid = holdings.filter(h => h.category === 'NFT').length;
    return Math.min(90, 50 + illiquid * 10);
  }

  private calculateMarketRisk(holdings: { category: string }[]): number {
    const volatile = holdings.filter(h => ['DeFi', 'NFT'].includes(h.category)).length;
    return Math.min(100, 40 + volatile * 5);
  }
}

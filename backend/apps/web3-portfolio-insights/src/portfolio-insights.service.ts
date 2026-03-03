import { Injectable } from '@nestjs/common';

interface TokenHolding {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  category: string;
}

interface PortfolioData {
  totalValue: number;
  tokens: TokenHolding[];
  chainId: number;
}

@Injectable()
export class PortfolioInsightsService {
  
  /**
   * Generate comprehensive AI-powered insights for a portfolio
   */
  async generateInsights(address: string, chainId: number): Promise<any> {
    const portfolio = await this.getPortfolioData(address, chainId);
    
    const insights = this.analyzePortfolioComposition(portfolio);
    const riskScore = this.calculateRiskScore(portfolio);
    const recommendations = this.generateRecommendations(portfolio, riskScore);
    
    return {
      address,
      chainId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalValue: portfolio.totalValue,
        tokenCount: portfolio.tokens.length,
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
      },
      insights,
      recommendations,
      aiAnalysis: this.generateAIAnalysis(portfolio, insights, riskScore),
    };
  }

  /**
   * Assess portfolio risk
   */
  async assessRisk(address: string, chainId: number): Promise<any> {
    const portfolio = await this.getPortfolioData(address, chainId);
    
    const riskScore = this.calculateRiskScore(portfolio);
    const factors = this.analyzeRiskFactors(portfolio);
    const mitigation = this.suggestRiskMitigation(portfolio, factors);
    
    return {
      address,
      chainId,
      assessedAt: new Date().toISOString(),
      overallRisk: {
        score: riskScore,
        level: this.getRiskLevel(riskScore),
        trend: this.analyzeRiskTrend(portfolio),
      },
      factors,
      mitigation,
      stressTest: this.runStressTest(portfolio),
    };
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(address: string, chainId: number): Promise<any> {
    const portfolio = await this.getPortfolioData(address, chainId);
    
    const recommendations = [];
    
    // Diversification recommendations
    const diversificationScore = this.calculateDiversificationScore(portfolio);
    if (diversificationScore < 50) {
      recommendations.push({
        type: 'diversification',
        priority: 'high',
        title: 'Improve Portfolio Diversification',
        description: 'Your portfolio is concentrated in few assets. Consider spreading investments across more tokens.',
        action: 'Add more diverse assets to reduce concentration risk.',
        potentialImpact: 'Reduce portfolio volatility by 15-25%',
      });
    }
    
    // Stablecoin recommendations
    const stablecoinRatio = this.calculateStablecoinRatio(portfolio);
    if (stablecoinRatio < 10) {
      recommendations.push({
        type: 'stablecoin',
        priority: 'medium',
        title: 'Consider Adding Stablecoins',
        description: 'Your portfolio lacks stablecoin allocation for volatility hedging.',
        action: 'Allocate 10-20% to stablecoins (USDC/USDT/DAI).',
        potentialImpact: 'Reduce drawdowns during market downturns',
      });
    }
    
    // Gas optimization
    if (portfolio.tokens.length > 10) {
      recommendations.push({
        type: 'gas',
        priority: 'low',
        title: 'Consider Token Consolidation',
        description: 'Managing many small positions incurs high gas costs.',
        action: 'Consider consolidating small positions to reduce gas costs.',
        potentialImpact: 'Save 20-30% on future transaction costs',
      });
    }
    
    // DeFi exposure
    const defiExposure = this.calculateDefiExposure(portfolio);
    if (defiExposure > 60) {
      recommendations.push({
        type: 'defi_risk',
        priority: 'medium',
        title: 'High DeFi Exposure',
        description: 'Over 60% of portfolio in DeFi protocols increases smart contract risk.',
        action: 'Consider reducing DeFi exposure or using insurance.',
        potentialImpact: 'Reduce smart contract counterparty risk',
      });
    }
    
    return {
      address,
      generatedAt: new Date().toISOString(),
      optimizationScore: this.calculateOptimizationScore(portfolio),
      recommendations,
      quickWins: this.findQuickWins(portfolio),
    };
  }

  /**
   * Analyze market sentiment based on portfolio
   */
  async analyzeMarketSentiment(address: string, chainId: number): Promise<any> {
    const portfolio = await this.getPortfolioData(address, chainId);
    
    const sentiment = this.calculatePortfolioSentiment(portfolio);
    const sectorExposure = this.analyzeSectorExposure(portfolio);
    const marketCorrelation = this.estimateMarketCorrelation(portfolio);
    
    return {
      address,
      analyzedAt: new Date().toISOString(),
      overallSentiment: sentiment,
      sectorExposure,
      marketCorrelation,
      sentimentByToken: portfolio.tokens.map(token => ({
        symbol: token.symbol,
        sentiment: this.getTokenSentiment(token),
        rationale: this.getTokenSentimentRationale(token),
      })),
    };
  }

  /**
   * Compare portfolio with market benchmarks
   */
  async compareWithBenchmark(address: string, chainId: number): Promise<any> {
    const portfolio = await this.getPortfolioData(address, chainId);
    
    const benchmark = this.getBenchmarkData();
    const comparison = this.performBenchmarkComparison(portfolio, benchmark);
    
    return {
      address,
      benchmark: 'Crypto Market Index',
      comparedAt: new Date().toISOString(),
      comparison,
      percentile: this.calculatePercentile(portfolio, benchmark),
      recommendation: this.getBenchmarkRecommendation(comparison),
    };
  }

  // Helper methods

  private async getPortfolioData(address: string, chainId: number): Promise<PortfolioData> {
    // Simulated portfolio data - in production, this would fetch from blockchain
    const tokens: TokenHolding[] = [
      { symbol: 'ETH', name: 'Ethereum', balance: 5.2, value: 15600, change24h: 2.5, category: 'Layer1' },
      { symbol: 'USDC', name: 'USD Coin', balance: 5000, value: 5000, change24h: 0.01, category: 'Stablecoin' },
      { symbol: 'UNI', name: 'Uniswap', balance: 250, value: 1875, change24h: -1.2, category: 'DeFi' },
      { symbol: 'AAVE', name: 'Aave', balance: 50, value: 1650, change24h: 3.2, category: 'DeFi' },
      { symbol: 'LINK', name: 'Chainlink', balance: 200, value: 1600, change24h: 1.8, category: 'DeFi' },
      { symbol: 'SOL', name: 'Solana', balance: 30, value: 900, change24h: -0.5, category: 'Layer1' },
    ];
    
    const totalValue = tokens.reduce((sum, t) => sum + t.value, 0);
    
    return { totalValue, tokens, chainId };
  }

  private getBenchmarkData(): any {
    return {
      cryptoMarketIndex: {
        eth: 30,
        stablecoins: 20,
        defi: 25,
        layer1: 15,
        other: 10,
      },
      averageReturn30d: 5.2,
      averageVolatility: 45,
    };
  }

  private analyzePortfolioComposition(portfolio: PortfolioData): any[] {
    const insights = [];
    
    // Concentration insight
    const topHolding = portfolio.tokens.reduce((max, t) => t.value > max.value ? t : max, portfolio.tokens[0]);
    const concentration = (topHolding.value / portfolio.totalValue) * 100;
    
    if (concentration > 40) {
      insights.push({
        type: 'concentration',
        severity: 'warning',
        title: 'High Concentration Risk',
        description: `${topHolding.symbol} represents ${concentration.toFixed(1)}% of your portfolio.`,
        insight: 'Consider diversifying to reduce single-point failure risk.',
      });
    }
    
    // Category distribution
    const categoryMap = new Map<string, number>();
    portfolio.tokens.forEach(t => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.value);
    });
    
    const categories = Array.from(categoryMap.entries()).map(([cat, val]) => ({
      category: cat,
      value: val,
      percentage: (val / portfolio.totalValue) * 100,
    }));
    
    insights.push({
      type: 'distribution',
      severity: 'info',
      title: 'Asset Allocation',
      description: `Portfolio spans ${categories.length} categories`,
      breakdown: categories,
    });
    
    // Performance insights
    const bestPerformer = portfolio.tokens.reduce((max, t) => t.change24h > max.change24h ? t : max, portfolio.tokens[0]);
    const worstPerformer = portfolio.tokens.reduce((min, t) => t.change24h < min.change24h ? t : min, portfolio.tokens[0]);
    
    insights.push({
      type: 'performance',
      severity: 'info',
      title: '24h Performance',
      description: `Best: ${bestPerformer.symbol} (+${bestPerformer.change24h}%), Worst: ${worstPerformer.symbol} (${worstPerformer.change24h}%)`,
      bestPerformer: { symbol: bestPerformer.symbol, change: bestPerformer.change24h },
      worstPerformer: { symbol: worstPerformer.symbol, change: worstPerformer.change24h },
    });
    
    return insights;
  }

  private calculateRiskScore(portfolio: PortfolioData): number {
    let riskScore = 30; // Base risk
    
    // Concentration risk
    const topHolding = portfolio.tokens.reduce((max, t) => t.value > max.value ? t : max, portfolio.tokens[0]);
    if ((topHolding.value / portfolio.totalValue) > 0.4) riskScore += 25;
    
    // Category risk
    const categories = new Set(portfolio.tokens.map(t => t.category));
    if (categories.size < 3) riskScore += 15;
    
    // Volatility risk (based on 24h changes)
    const avgVolatility = portfolio.tokens.reduce((sum, t) => sum + Math.abs(t.change24h), 0) / portfolio.tokens.length;
    if (avgVolatility > 5) riskScore += 20;
    
    // Stablecoin ratio
    const stablecoinRatio = this.calculateStablecoinRatio(portfolio);
    if (stablecoinRatio < 5) riskScore += 10;
    
    return Math.min(100, riskScore);
  }

  private getRiskLevel(score: number): string {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  private generateRecommendations(portfolio: PortfolioData, riskScore: number): any[] {
    const recommendations = [];
    
    if (riskScore > 60) {
      recommendations.push({
        priority: 'high',
        area: 'risk',
        recommendation: 'Reduce portfolio risk by diversifying across more assets and categories.',
      });
    }
    
    const stablecoinRatio = this.calculateStablecoinRatio(portfolio);
    if (stablecoinRatio < 15) {
      recommendations.push({
        priority: 'medium',
        area: 'stability',
        recommendation: 'Add stablecoins to hedge against market volatility.',
      });
    }
    
    return recommendations;
  }

  private generateAIAnalysis(portfolio: PortfolioData, insights: any[], riskScore: number): string {
    const totalValue = portfolio.totalValue;
    const tokenCount = portfolio.tokens.length;
    const riskLevel = this.getRiskLevel(riskScore);
    
    let analysis = `Your portfolio has a total value of $${totalValue.toLocaleString()} across ${tokenCount} tokens. `;
    
    if (riskLevel === 'low') {
      analysis += 'Overall, your portfolio shows a conservative allocation with good risk management. ';
    } else if (riskLevel === 'high' || riskLevel === 'critical') {
      analysis += 'Your portfolio carries elevated risk due to concentration and limited diversification. ';
    }
    
    const defiTokens = portfolio.tokens.filter(t => t.category === 'DeFi');
    if (defiTokens.length > 0) {
      analysis += `You have exposure to ${defiTokens.length} DeFi tokens, which provide yield opportunities but also carry smart contract risk. `;
    }
    
    analysis += 'Consider reviewing your allocation periodically to maintain optimal risk-adjusted returns.';
    
    return analysis;
  }

  private analyzeRiskFactors(portfolio: PortfolioData): any[] {
    const factors = [];
    
    // Concentration
    const topHolding = portfolio.tokens.reduce((max, t) => t.value > max.value ? t : max, portfolio.tokens[0]);
    const concentration = (topHolding.value / portfolio.totalValue) * 100;
    factors.push({
      factor: 'Concentration Risk',
      impact: concentration > 40 ? 'high' : 'medium',
      description: `${topHolding.symbol} is ${concentration.toFixed(1)}% of portfolio`,
    });
    
    // Stablecoin
    const stablecoinRatio = this.calculateStablecoinRatio(portfolio);
    factors.push({
      factor: 'Stablecoin Buffer',
      impact: stablecoinRatio < 10 ? 'high' : stablecoinRatio < 20 ? 'medium' : 'low',
      description: `${stablecoinRatio.toFixed(1)}% in stablecoins`,
    });
    
    // Category diversification
    const categories = new Set(portfolio.tokens.map(t => t.category));
    factors.push({
      factor: 'Category Diversification',
      impact: categories.size < 3 ? 'high' : categories.size < 5 ? 'medium' : 'low',
      description: `${categories.size} asset categories`,
    });
    
    return factors;
  }

  private suggestRiskMitigation(portfolio: PortfolioData, factors: any[]): any[] {
    const mitigation = [];
    
    const highImpactFactors = factors.filter(f => f.impact === 'high');
    if (highImpactFactors.length > 0) {
      mitigation.push({
        action: 'Rebalance Portfolio',
        description: 'Spread holdings across more assets to reduce concentration',
        priority: 'high',
      });
    }
    
    const stablecoinRatio = this.calculateStablecoinRatio(portfolio);
    if (stablecoinRatio < 15) {
      mitigation.push({
        action: 'Add Stablecoin Allocation',
        description: 'Maintain 15-25% in stablecoins for volatility hedging',
        priority: 'medium',
      });
    }
    
    return mitigation;
  }

  private runStressTest(portfolio: PortfolioData): any {
    // Simulate 30% market drop
    const stressedValue = portfolio.totalValue * 0.7;
    const loss = portfolio.totalValue - stressedValue;
    
    // Simulate 50% market drop
    const severeStressedValue = portfolio.totalValue * 0.5;
    const severeLoss = portfolio.totalValue - severeStressedValue;
    
    return {
      moderateCrash: {
        scenario: '30% market decline',
        portfolioValue: stressedValue,
        absoluteLoss: loss,
        percentageLoss: 30,
      },
      severeCrash: {
        scenario: '50% market decline',
        portfolioValue: severeStressedValue,
        absoluteLoss: severeLoss,
        percentageLoss: 50,
      },
      recommendation: loss > portfolio.totalValue * 0.2 
        ? 'Consider adding more stable assets'
        : 'Portfolio has reasonable stress resistance',
    };
  }

  private calculateDiversificationScore(portfolio: PortfolioData): number {
    const categories = new Set(portfolio.tokens.map(t => t.category));
    const tokens = portfolio.tokens.length;
    
    let score = (categories.size / 6) * 50; // Max 50 points for categories
    score += Math.min(50, tokens * 5); // Max 50 points for token count
    
    return Math.min(100, score);
  }

  private calculateStablecoinRatio(portfolio: PortfolioData): number {
    const stablecoinValue = portfolio.tokens
      .filter(t => t.category === 'Stablecoin')
      .reduce((sum, t) => sum + t.value, 0);
    
    return (stablecoinValue / portfolio.totalValue) * 100;
  }

  private calculateDefiExposure(portfolio: PortfolioData): number {
    const defiValue = portfolio.tokens
      .filter(t => t.category === 'DeFi')
      .reduce((sum, t) => sum + t.value, 0);
    
    return (defiValue / portfolio.totalValue) * 100;
  }

  private calculateOptimizationScore(portfolio: PortfolioData): number {
    let score = 100;
    
    const diversification = this.calculateDiversificationScore(portfolio);
    if (diversification < 50) score -= 20;
    
    const stablecoinRatio = this.calculateStablecoinRatio(portfolio);
    if (stablecoinRatio < 10) score -= 15;
    
    const topHolding = portfolio.tokens.reduce((max, t) => t.value > max.value ? t : max, portfolio.tokens[0]);
    if ((topHolding.value / portfolio.totalValue) > 0.4) score -= 15;
    
    return Math.max(0, score);
  }

  private findQuickWins(portfolio: PortfolioData): any[] {
    const wins = [];
    
    if (portfolio.tokens.length > 10) {
      wins.push({
        action: 'Consolidate small positions',
        savings: '~20% gas costs on future transactions',
      });
    }
    
    const smallTokens = portfolio.tokens.filter(t => t.value < 100);
    if (smallTokens.length > 3) {
      wins.push({
        action: 'Review small positions',
        savings: 'Potential to free up capital',
      });
    }
    
    return wins;
  }

  private calculatePortfolioSentiment(portfolio: PortfolioData): any {
    const avgChange = portfolio.tokens.reduce((sum, t) => sum + t.change24h, 0) / portfolio.tokens.length;
    
    let sentiment: string;
    let score: number;
    
    if (avgChange > 3) {
      sentiment = 'bullish';
      score = 75;
    } else if (avgChange > 0) {
      sentiment = 'slightly_bullish';
      score = 60;
    } else if (avgChange > -3) {
      sentiment = 'neutral';
      score = 50;
    } else if (avgChange > -10) {
      sentiment = 'slightly_bearish';
      score = 40;
    } else {
      sentiment = 'bearish';
      score = 25;
    }
    
    return { sentiment, score, averageChange24h: avgChange };
  }

  private analyzeSectorExposure(portfolio: PortfolioData): any {
    const sectorMap = new Map<string, number>();
    portfolio.tokens.forEach(t => {
      const current = sectorMap.get(t.category) || 0;
      sectorMap.set(t.category, current + t.value);
    });
    
    return Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value,
      percentage: (value / portfolio.totalValue) * 100,
    }));
  }

  private estimateMarketCorrelation(portfolio: PortfolioData): any {
    // Simplified correlation estimate
    const layer1Tokens = portfolio.tokens.filter(t => t.category === 'Layer1');
    const defiTokens = portfolio.tokens.filter(t => t.category === 'DeFi');
    
    return {
      btcCorrelation: layer1Tokens.length > 0 ? 0.75 : 0.5,
      ethCorrelation: layer1Tokens.length > 0 ? 0.85 : 0.6,
      defiCorrelation: defiTokens.length > 0 ? 0.65 : 0.4,
      overallCorrelation: 0.65,
    };
  }

  private getTokenSentiment(token: TokenHolding): string {
    if (token.change24h > 5) return 'strongly_bullish';
    if (token.change24h > 0) return 'bullish';
    if (token.change24h > -5) return 'neutral';
    if (token.change24h > -10) return 'bearish';
    return 'strongly_bearish';
  }

  private getTokenSentimentRationale(token: TokenHolding): string {
    if (token.change24h > 0) {
      return `${token.symbol} is up ${token.change24h}% in the last 24 hours, showing positive momentum.`;
    } else {
      return `${token.symbol} is down ${Math.abs(token.change24h)}% in the last 24 hours.`;
    }
  }

  private performBenchmarkComparison(portfolio: PortfolioData, benchmark: any): any {
    const portfolioCategories = new Map<string, number>();
    portfolio.tokens.forEach(t => {
      const current = portfolioCategories.get(t.category) || 0;
      portfolioCategories.set(t.category, current + t.value);
    });
    
    const comparison = {};
    const categories = ['ETH', 'stablecoins', 'defi', 'layer1', 'other'];
    
    categories.forEach(cat => {
      const portfolioPct = (portfolioCategories.get(cat) || 0) / portfolio.totalValue * 100;
      const benchmarkPct = benchmark.cryptoMarketIndex[cat] || 0;
      comparison[cat] = {
        portfolio: portfolioPct.toFixed(1),
        benchmark: benchmarkPct,
        difference: (portfolioPct - benchmarkPct).toFixed(1),
      };
    });
    
    return comparison;
  }

  private calculatePercentile(portfolio: PortfolioData, benchmark: any): number {
    // Simplified percentile calculation
    const riskScore = this.calculateRiskScore(portfolio);
    const diversification = this.calculateDiversificationScore(portfolio);
    
    // Higher diversification = higher percentile
    return Math.min(99, Math.max(1, Math.round((diversification / 100) * 80 + 20)));
  }

  private getBenchmarkRecommendation(comparison: any): string {
    const differences = Object.values(comparison).map((c: any) => Math.abs(parseFloat(c.difference)));
    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    
    if (avgDiff < 10) {
      return 'Your portfolio allocation is well-aligned with market benchmarks.';
    } else if (avgDiff < 25) {
      return 'Your portfolio has moderate deviations from benchmarks. Consider rebalancing.';
    } else {
      return 'Your portfolio significantly deviates from benchmarks. Review your allocation strategy.';
    }
  }

  private analyzeRiskTrend(portfolio: PortfolioData): string {
    const recentVolatility = portfolio.tokens.reduce((sum, t) => sum + Math.abs(t.change24h), 0) / portfolio.tokens.length;
    
    if (recentVolatility < 2) return 'stable';
    if (recentVolatility < 5) return 'moderate';
    return 'volatile';
  }
}

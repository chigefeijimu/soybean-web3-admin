import { Injectable } from '@nestjs/common';

interface RiskScore {
  score: number;
  level: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  category: 'low' | 'medium' | 'high' | 'critical';
}

interface ProtocolRisk {
  protocol: string;
  chain: string;
  tvl: number;
  riskScore: number;
  riskLevel: string;
  factors: string[];
}

interface Position {
  token: string;
  symbol: string;
  amount: number;
  value: number;
  chain: string;
  protocol?: string;
  category: string;
}

@Injectable()
export class Web3PortfolioRiskAssessmentService {
  private readonly chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];
  private readonly riskWeights = {
    concentration: 0.25,
    diversification: 0.20,
    protocol: 0.20,
    liquidity: 0.15,
    volatility: 0.10,
    complexity: 0.10,
  };

  async getRiskDashboard() {
    const totalPortfolios = Math.floor(Math.random() * 5000) + 1000;
    const avgRiskScore = Math.floor(Math.random() * 30) + 40;
    const highRiskCount = Math.floor(totalPortfolios * 0.15);
    const mediumRiskCount = Math.floor(totalPortfolios * 0.35);
    const lowRiskCount = totalPortfolios - highRiskCount - mediumRiskCount;

    return {
      totalPortfolios,
      avgRiskScore,
      riskDistribution: {
        high: highRiskCount,
        medium: mediumRiskCount,
        low: lowRiskCount,
      },
      topRisks: [
        { type: 'High Concentration', count: Math.floor(totalPortfolios * 0.22) },
        { type: 'Low Diversification', count: Math.floor(totalPortfolios * 0.18) },
        { type: 'High Volatility Exposure', count: Math.floor(totalPortfolios * 0.15) },
        { type: 'Protocol Concentration', count: Math.floor(totalPortfolios * 0.12) },
        { type: 'Liquidity Risk', count: Math.floor(totalPortfolios * 0.08) },
      ],
      chains: this.chains.map(chain => ({
        name: chain,
        avgRiskScore: Math.floor(Math.random() * 25) + 45,
        portfolioCount: Math.floor(Math.random() * 800) + 100,
      })),
      timestamp: Date.now(),
    };
  }

  async analyzePortfolioRisk(address: string, chains: string[]): Promise<{
    address: string;
    totalValue: number;
    riskScore: RiskScore;
    riskFactors: { factor: string; weight: number; value: number; description: string }[];
    chainDistribution: { chain: string; value: number; percentage: number }[];
    categoryDistribution: { category: string; value: number; percentage: number }[];
    topHoldings: Position[];
    riskFlags: string[];
    recommendations: string[];
  }> {
    const positions = this.generateMockPositions(address, chains);
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    
    const concentrationRisk = this.calculateConcentrationRisk(positions, totalValue);
    const diversificationScore = this.calculateAssetDiversification(positions, totalValue);
    const protocolRisk = this.calculateProtocolRisk(positions);
    const liquidityRisk = this.calculateLiquidityRisk(positions);
    const volatilityRisk = this.calculateVolatilityRisk(positions);
    const complexityRisk = this.calculateComplexityRisk(positions, chains);

    const overallScore = Math.round(
      concentrationRisk.value * this.riskWeights.concentration +
      diversificationScore.value * this.riskWeights.diversification +
      protocolRisk.value * this.riskWeights.protocol +
      liquidityRisk.value * this.riskWeights.liquidity +
      volatilityRisk.value * this.riskWeights.volatility +
      complexityRisk.value * this.riskWeights.complexity
    );

    const riskLevel = this.getRiskLevel(overallScore);

    const chainDistribution = chains.map(chain => {
      const chainValue = positions
        .filter(p => p.chain === chain)
        .reduce((sum, p) => sum + p.value, 0);
      return {
        chain,
        value: chainValue,
        percentage: totalValue > 0 ? (chainValue / totalValue) * 100 : 0,
      };
    }).filter(c => c.value > 0);

    const categoryMap = new Map<string, number>();
    positions.forEach(p => {
      const current = categoryMap.get(p.category) || 0;
      categoryMap.set(p.category, current + p.value);
    });
    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));

    const riskFlags: string[] = [];
    if (concentrationRisk.value > 70) riskFlags.push('High concentration risk - single asset > 30%');
    if (diversificationScore.value > 70) riskFlags.push('Low diversification - too few assets');
    if (protocolRisk.value > 60) riskFlags.push('High protocol concentration risk');
    if (liquidityRisk.value > 65) riskFlags.push('Liquidity risk - illiquid assets');
    if (volatilityRisk.value > 70) riskFlags.push('High volatility exposure');
    if (chainDistribution.length === 1) riskFlags.push('Single chain risk - no cross-chain diversification');

    const recommendations = this.generateRecommendations(
      concentrationRisk, diversificationScore, protocolRisk, liquidityRisk, volatilityRisk, complexityRisk
    );

    return {
      address,
      totalValue: Math.round(totalValue * 100) / 100,
      riskScore: {
        score: overallScore,
        level: riskLevel,
        category: overallScore < 30 ? 'low' : overallScore < 50 ? 'medium' : overallScore < 70 ? 'high' : 'critical',
      },
      riskFactors: [
        { factor: 'Concentration', weight: this.riskWeights.concentration, ...concentrationRisk },
        { factor: 'Diversification', weight: this.riskWeights.diversification, ...diversificationScore },
        { factor: 'Protocol', weight: this.riskWeights.protocol, ...protocolRisk },
        { factor: 'Liquidity', weight: this.riskWeights.liquidity, ...liquidityRisk },
        { factor: 'Volatility', weight: this.riskWeights.volatility, ...volatilityRisk },
        { factor: 'Complexity', weight: this.riskWeights.complexity, ...complexityRisk },
      ],
      chainDistribution,
      categoryDistribution,
      topHoldings: positions.slice(0, 10),
      riskFlags,
      recommendations,
    };
  }

  async batchAnalyzeRisk(addresses: string[], chains?: string[]): Promise<{
    results: Array<{
      address: string;
      riskScore: RiskScore;
      totalValue: number;
    }>;
    summary: {
      total: number;
      avgRiskScore: number;
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
  }> {
    const chainList = chains || this.chains;
    const results = await Promise.all(
      addresses.map(async address => {
        const analysis = await this.analyzePortfolioRisk(address, chainList);
        return {
          address,
          riskScore: analysis.riskScore,
          totalValue: analysis.totalValue,
        };
      })
    );

    const avgRiskScore = Math.round(
      results.reduce((sum, r) => sum + r.riskScore.score, 0) / results.length
    );

    return {
      results,
      summary: {
        total: results.length,
        avgRiskScore,
        highRisk: results.filter(r => r.riskScore.category === 'high' || r.riskScore.category === 'critical').length,
        mediumRisk: results.filter(r => r.riskScore.category === 'medium').length,
        lowRisk: results.filter(r => r.riskScore.category === 'low').length,
      },
    };
  }

  async analyzeConcentrationRisk(address: string): Promise<{
    address: string;
    overallConcentration: number;
    assetConcentration: { token: string; percentage: number; isHigh: boolean }[];
    chainConcentration: { chain: string; percentage: number; isHigh: boolean }[];
    protocolConcentration: { protocol: string; percentage: number; isHigh: boolean }[];
    categoryConcentration: { category: string; percentage: number; isHigh: boolean }[];
    riskLevel: string;
    recommendations: string[];
  }> {
    const positions = this.generateMockPositions(address, this.chains);
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);

    const assetConcentration = positions
      .map(p => ({
        token: p.symbol,
        percentage: totalValue > 0 ? (p.value / totalValue) * 100 : 0,
        isHigh: (p.value / totalValue) * 100 > 25,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    const chainMap = new Map<string, number>();
    positions.forEach(p => {
      chainMap.set(p.chain, (chainMap.get(p.chain) || 0) + p.value);
    });
    const chainConcentration = Array.from(chainMap.entries())
      .map(([chain, value]) => ({
        chain,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        isHigh: (value / totalValue) * 100 > 40,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const protocolMap = new Map<string, number>();
    positions.forEach(p => {
      if (p.protocol) {
        protocolMap.set(p.protocol, (protocolMap.get(p.protocol) || 0) + p.value);
      }
    });
    const protocolConcentration = Array.from(protocolMap.entries())
      .map(([protocol, value]) => ({
        protocol,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        isHigh: (value / totalValue) * 100 > 30,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    const categoryMap = new Map<string, number>();
    positions.forEach(p => {
      categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + p.value);
    });
    const categoryConcentration = Array.from(categoryMap.entries())
      .map(([category, value]) => ({
        category,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        isHigh: (value / totalValue) * 100 > 35,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const maxConcentration = Math.max(
      ...assetConcentration.map(a => a.percentage),
      ...chainConcentration.map(c => c.percentage)
    );

    const recommendations: string[] = [];
    if (maxConcentration > 50) {
      recommendations.push('Extremely high concentration - immediately diversify');
    } else if (maxConcentration > 30) {
      recommendations.push('High concentration risk - consider reducing largest position');
    }
    if (chainConcentration.length === 1) {
      recommendations.push('Single chain exposure - consider cross-chain diversification');
    }
    if (protocolConcentration.length > 0 && protocolConcentration[0].percentage > 50) {
      recommendations.push('Heavy protocol dependence - spread across multiple protocols');
    }

    return {
      address,
      overallConcentration: Math.round(maxConcentration),
      assetConcentration,
      chainConcentration,
      protocolConcentration,
      categoryConcentration,
      riskLevel: maxConcentration > 50 ? 'critical' : maxConcentration > 30 ? 'high' : maxConcentration > 15 ? 'medium' : 'low',
      recommendations,
    };
  }

  async getProtocolRisks(address: string): Promise<{
    address: string;
    protocols: ProtocolRisk[];
    highestRiskProtocol: ProtocolRisk | null;
    avgRiskScore: number;
  }> {
    const positions = this.generateMockPositions(address, this.chains);
    const protocolMap = new Map<string, { tvl: number; chain: string; riskScore: number }>();

    positions.forEach(p => {
      if (p.protocol) {
        const existing = protocolMap.get(p.protocol) || { tvl: 0, chain: p.chain, riskScore: 0 };
        existing.tvl += p.value;
        existing.riskScore = Math.floor(Math.random() * 40) + 30;
        protocolMap.set(p.protocol, existing);
      }
    });

    const protocols: ProtocolRisk[] = Array.from(protocolMap.entries())
      .map(([protocol, data]) => ({
        protocol,
        chain: data.chain,
        tvl: Math.round(data.tvl * 100) / 100,
        riskScore: data.riskScore,
        riskLevel: data.riskScore < 30 ? 'LOW' : data.riskScore < 50 ? 'MEDIUM' : data.riskScore < 70 ? 'HIGH' : 'CRITICAL',
        factors: this.getProtocolRiskFactors(protocol),
      }))
      .sort((a, b) => b.riskScore - a.riskScore);

    return {
      address,
      protocols,
      highestRiskProtocol: protocols[0] || null,
      avgRiskScore: protocols.length > 0 
        ? Math.round(protocols.reduce((sum, p) => sum + p.riskScore, 0) / protocols.length)
        : 0,
    };
  }

  async stressTestPortfolio(address: string, scenarios: string[]): Promise<{
    address: string;
    scenarios: Array<{
      name: string;
      description: string;
      impact: number;
      impactPercentage: number;
      affectedAssets: string[];
      severity: string;
    }>;
    overallResilience: number;
    recommendation: string;
  }> {
    const positions = this.generateMockPositions(address, this.chains);
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);

    const scenarioResults = scenarios.map(scenario => {
      let impact = 0;
      let affectedAssets: string[] = [];
      
      switch (scenario) {
        case 'market_crash_20':
          impact = totalValue * 0.20;
          affectedAssets = positions.filter(p => p.category !== 'stablecoins').map(p => p.symbol);
          break;
        case 'market_crash_40':
          impact = totalValue * 0.40;
          affectedAssets = positions.filter(p => p.category !== 'stablecoins').map(p => p.symbol);
          break;
        case 'stablecoin_depeg':
          const stableValue = positions
            .filter(p => p.category === 'stablecoins')
            .reduce((sum, p) => sum + p.value, 0);
          impact = stableValue * 0.20;
          affectedAssets = positions.filter(p => p.category === 'stablecoins').map(p => p.symbol);
          break;
        case 'liquidity_crisis':
          impact = totalValue * 0.25;
          affectedAssets = positions.filter(p => p.category === 'defi' || p.category === 'nft').map(p => p.symbol);
          break;
        case 'single_protocol_fail':
          impact = totalValue * 0.15;
          affectedAssets = positions.slice(0, 3).map(p => p.symbol);
          break;
        default:
          impact = totalValue * 0.10;
      }

      const impactPercentage = totalValue > 0 ? (impact / totalValue) * 100 : 0;
      return {
        name: scenario,
        description: this.getScenarioDescription(scenario),
        impact: Math.round(impact * 100) / 100,
        impactPercentage: Math.round(impactPercentage * 10) / 10,
        affectedAssets,
        severity: impactPercentage > 30 ? 'high' : impactPercentage > 15 ? 'medium' : 'low',
      };
    });

    const maxImpact = Math.max(...scenarioResults.map(s => s.impactPercentage));
    const overallResilience = Math.round(100 - maxImpact);

    return {
      address,
      scenarios: scenarioResults,
      overallResilience,
      recommendation: overallResilience > 70 
        ? 'Portfolio shows good resilience to stress scenarios'
        : overallResilience > 50
        ? 'Consider diversifying to improve stress resilience'
        : 'Portfolio is highly vulnerable - immediate rebalancing recommended',
    };
  }

  async calculateDiversificationScore(address: string): Promise<{
    address: string;
    overallScore: number;
    level: string;
    assetCount: number;
    chainCount: number;
    protocolCount: number;
    categoryCount: number;
    scores: {
      asset: { score: number; rating: string };
      chain: { score: number; rating: string };
      protocol: { score: number; rating: string };
      category: { score: number; rating: string };
    };
    recommendations: string[];
  }> {
    const positions = this.generateMockPositions(address, this.chains);
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);

    const assetCount = positions.length;
    const chainCount = new Set(positions.map(p => p.chain)).size;
    const protocolCount = new Set(positions.map(p => p.protocol).filter(Boolean)).size;
    const categoryCount = new Set(positions.map(p => p.category)).size;

    const assetScore = Math.min(100, (assetCount / 10) * 100);
    const chainScore = Math.min(100, (chainCount / 5) * 100);
    const protocolScore = Math.min(100, (protocolCount / 5) * 100);
    const categoryScore = Math.min(100, (categoryCount / 5) * 100);

    const overallScore = Math.round((assetScore * 0.3 + chainScore * 0.25 + protocolScore * 0.25 + categoryScore * 0.2));

    const recommendations: string[] = [];
    if (assetCount < 5) recommendations.push('Add more unique assets to diversify');
    if (chainCount < 3) recommendations.push('Consider cross-chain diversification');
    if (protocolCount < 3) recommendations.push('Spread holdings across more protocols');

    return {
      address,
      overallScore,
      level: overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : overallScore >= 40 ? 'fair' : 'poor',
      assetCount,
      chainCount,
      protocolCount,
      categoryCount,
      scores: {
        asset: { score: assetScore, rating: assetScore >= 80 ? 'A' : assetScore >= 60 ? 'B' : assetScore >= 40 ? 'C' : 'D' },
        chain: { score: chainScore, rating: chainScore >= 80 ? 'A' : chainScore >= 60 ? 'B' : chainScore >= 40 ? 'C' : 'D' },
        protocol: { score: protocolScore, rating: protocolScore >= 80 ? 'A' : protocolScore >= 60 ? 'B' : protocolScore >= 40 ? 'C' : 'D' },
        category: { score: categoryScore, rating: categoryScore >= 80 ? 'A' : categoryScore >= 60 ? 'B' : categoryScore >= 40 ? 'C' : 'D' },
      },
      recommendations,
    };
  }

  async getRiskRecommendations(address: string): Promise<{
    address: string;
    priority: 'high' | 'medium' | 'low';
    recommendations: Array<{
      id: string;
      title: string;
      description: string;
      impact: string;
      difficulty: string;
      estimatedBenefit: number;
    }>;
  }> {
    const positions = this.generateMockPositions(address, this.chains);
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);

    const recommendations: Array<{
      id: string;
      title: string;
      description: string;
      impact: string;
      difficulty: string;
      estimatedBenefit: number;
    }> = [];

    // Check concentration
    const sortedPositions = [...positions].sort((a, b) => b.value - a.value);
    const topPositionPercent = totalValue > 0 ? (sortedPositions[0]?.value / totalValue) * 100 : 0;
    if (topPositionPercent > 30) {
      recommendations.push({
        id: 'reduce_concentration',
        title: 'Reduce Single Asset Concentration',
        description: `Your largest position represents ${topPositionPercent.toFixed(1)}% of portfolio`,
        impact: 'high',
        difficulty: 'medium',
        estimatedBenefit: 15,
      });
    }

    // Check chain diversity
    const chainCount = new Set(positions.map(p => p.chain)).size;
    if (chainCount < 3) {
      recommendations.push({
        id: 'add_chains',
        title: 'Add Cross-Chain Diversification',
        description: 'Currently only using ' + chainCount + ' chain(s)',
        impact: 'medium',
        difficulty: 'medium',
        estimatedBenefit: 10,
      });
    }

    // Check stablecoin ratio
    const stableValue = positions
      .filter(p => p.category === 'stablecoins')
      .reduce((sum, p) => sum + p.value, 0);
    const stablePercent = totalValue > 0 ? (stableValue / totalValue) * 100 : 0;
    if (stablePercent < 10) {
      recommendations.push({
        id: 'add_stablecoins',
        title: 'Add Stablecoin Holdings',
        description: 'Less than 10% in stablecoins - consider adding buffer',
        impact: 'medium',
        difficulty: 'low',
        estimatedBenefit: 8,
      });
    }

    // Check DeFi exposure
    const defiValue = positions
      .filter(p => p.category === 'defi')
      .reduce((sum, p) => sum + p.value, 0);
    const defiPercent = totalValue > 0 ? (defiValue / totalValue) * 100 : 0;
    if (defiPercent > 60) {
      recommendations.push({
        id: 'reduce_defi',
        title: 'Reduce DeFi Exposure',
        description: 'High DeFi allocation increases smart contract risk',
        impact: 'high',
        difficulty: 'high',
        estimatedBenefit: 12,
      });
    }

    // Check NFT exposure
    const nftValue = positions
      .filter(p => p.category === 'nft')
      .reduce((sum, p) => sum + p.value, 0);
    const nftPercent = totalValue > 0 ? (nftValue / totalValue) * 100 : 0;
    if (nftPercent > 20) {
      recommendations.push({
        id: 'reduce_nft',
        title: 'Reduce NFT Allocation',
        description: 'NFTs are highly illiquid and volatile',
        impact: 'medium',
        difficulty: 'medium',
        estimatedBenefit: 10,
      });
    }

    return {
      address,
      priority: recommendations.filter(r => r.impact === 'high').length > 0 ? 'high' : 
               recommendations.filter(r => r.impact === 'medium').length > 0 ? 'medium' : 'low',
      recommendations: recommendations.slice(0, 5),
    };
  }

  async getHistoricalRiskScore(address: string, days: number): Promise<{
    address: string;
    days: number;
    history: Array<{ date: string; score: number; level: string }>;
    trend: string;
    change: number;
  }> {
    const history: Array<{ date: string; score: number; level: string }> = [];
    const now = new Date();
    let currentScore = Math.floor(Math.random() * 30) + 50;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      currentScore += Math.floor(Math.random() * 10) - 5;
      currentScore = Math.max(20, Math.min(90, currentScore));
      history.push({
        date: date.toISOString().split('T')[0],
        score: currentScore,
        level: currentScore < 30 ? 'low' : currentScore < 50 ? 'medium' : currentScore < 70 ? 'high' : 'critical',
      });
    }

    const change = history[history.length - 1].score - history[0].score;
    return {
      address,
      days,
      history,
      trend: change > 5 ? 'improving' : change < -5 ? 'worsening' : 'stable',
      change,
    };
  }

  async createRiskAlert(params: {
    address: string;
    threshold: number;
    condition: 'above' | 'below';
    channels?: string[];
  }): Promise<{ success: boolean; alertId: string }> {
    return {
      success: true,
      alertId: 'alert_' + Math.random().toString(36).substr(2, 9),
    };
  }

  async getRiskAlerts(address: string): Promise<{
    address: string;
    alerts: Array<{
      id: string;
      threshold: number;
      condition: string;
      status: string;
      createdAt: string;
    }>;
  }> {
    return {
      address,
      alerts: [
        {
          id: 'alert_1',
          threshold: 60,
          condition: 'above',
          status: 'active',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };
  }

  async comparePortfolios(address1: string, address2: string): Promise<{
    comparison: {
      totalValue: { address1: number; address2: number; difference: number };
      riskScore: { address1: number; address2: number; winner: string };
      diversification: { address1: number; address2: number; winner: string };
      concentration: { address1: number; address2: number; winner: string };
    };
    recommendations: string[];
  }> {
    const analysis1 = await this.analyzePortfolioRisk(address1, this.chains);
    const analysis2 = await this.analyzePortfolioRisk(address2, this.chains);

    const recommendations: string[] = [];
    if (analysis1.riskScore.score < analysis2.riskScore.score) {
      recommendations.push(`${address1.slice(0, 6)}... has better risk profile`);
    } else {
      recommendations.push(`${address2.slice(0, 6)}... has better risk profile`);
    }

    return {
      comparison: {
        totalValue: {
          address1: analysis1.totalValue,
          address2: analysis2.totalValue,
          difference: Math.abs(analysis1.totalValue - analysis2.totalValue),
        },
        riskScore: {
          address1: analysis1.riskScore.score,
          address2: analysis2.riskScore.score,
          winner: analysis1.riskScore.score < analysis2.riskScore.score ? address1 : address2,
        },
        diversification: {
          address1: analysis1.riskFactors[1].value,
          address2: analysis2.riskFactors[1].value,
          winner: analysis1.riskFactors[1].value < analysis2.riskFactors[1].value ? address1 : address2,
        },
        concentration: {
          address1: analysis1.riskFactors[0].value,
          address2: analysis2.riskFactors[0].value,
          winner: analysis1.riskFactors[0].value < analysis2.riskFactors[0].value ? address1 : address2,
        },
      },
      recommendations,
    };
  }

  private generateMockPositions(address: string, chains: string[]): Position[] {
    const tokens = [
      { symbol: 'ETH', name: 'Ethereum', category: 'layer1' },
      { symbol: 'BTC', name: 'Bitcoin', category: 'layer1' },
      { symbol: 'USDC', name: 'USD Coin', category: 'stablecoins' },
      { symbol: 'USDT', name: 'Tether', category: 'stablecoins' },
      { symbol: 'UNI', name: 'Uniswap', category: 'defi' },
      { symbol: 'AAVE', name: 'Aave', category: 'defi' },
      { symbol: 'LINK', name: 'Chainlink', category: 'defi' },
      { symbol: 'MATIC', name: 'Polygon', category: 'layer1' },
      { symbol: 'ARB', name: 'Arbitrum', category: 'layer1' },
      { symbol: 'OP', name: 'Optimism', category: 'layer1' },
      { symbol: 'SOL', name: 'Solana', category: 'layer1' },
      { symbol: 'AVAX', name: 'Avalanche', category: 'layer1' },
    ];

    const protocols = ['Uniswap V3', 'Aave V3', 'Compound', 'Curve', 'Yearn', 'Lido', 'Gearbox'];
    const positions: Position[] = [];
    const numPositions = Math.floor(Math.random() * 8) + 5;

    for (let i = 0; i < numPositions; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const amount = Math.random() * 100 + 1;
      const price = Math.random() * 2000 + 10;
      
      positions.push({
        token: token.symbol,
        symbol: token.symbol,
        amount: Math.round(amount * 1000) / 1000,
        value: Math.round(amount * price * 100) / 100,
        chain,
        protocol: Math.random() > 0.3 ? protocols[Math.floor(Math.random() * protocols.length)] : undefined,
        category: token.category,
      });
    }

    return positions.sort((a, b) => b.value - a.value);
  }

  private calculateConcentrationRisk(positions: Position[], totalValue: number): { value: number; description: string } {
    if (positions.length === 0 || totalValue === 0) {
      return { value: 50, description: 'No positions' };
    }
    const topPositionPercent = (positions[0].value / totalValue) * 100;
    const value = Math.min(100, topPositionPercent * 2.5);
    return { value: Math.round(value), description: `Top holding: ${topPositionPercent.toFixed(1)}%` };
  }

  private calculateAssetDiversification(positions: Position[], totalValue: number): { value: number; description: string } {
    const uniqueAssets = new Set(positions.map(p => p.symbol)).size;
    const uniqueChains = new Set(positions.map(p => p.chain)).size;
    const score = 100 - ((10 - uniqueAssets) * 5 + (5 - uniqueChains) * 8);
    return { value: Math.max(0, Math.min(100, score)), description: `${uniqueAssets} assets, ${uniqueChains} chains` };
  }

  private calculateProtocolRisk(positions: Position[]): { value: number; description: string } {
    const protocolMap = new Map<string, number>();
    positions.forEach(p => {
      if (p.protocol) {
        protocolMap.set(p.protocol, (protocolMap.get(p.protocol) || 0) + p.value);
      }
    });
    const maxProtocolPercent = protocolMap.size > 0 
      ? Math.max(...Array.from(protocolMap.values()))
      : 0;
    return { value: Math.min(100, maxProtocolPercent / 2), description: `${protocolMap.size} protocols` };
  }

  private calculateLiquidityRisk(positions: Position[]): { value: number; description: string } {
    const illiquidCount = positions.filter(p => p.category === 'nft' || p.category === ' governance').length;
    return { value: Math.min(100, illiquidCount * 20), description: `${illiquidCount} potentially illiquid` };
  }

  private calculateVolatilityRisk(positions: Position[]): { value: number; description: string } {
    const volatileCount = positions.filter(p => p.category === 'layer1' || p.category === 'altcoin').length;
    return { value: Math.min(100, volatileCount * 12), description: `${volatileCount} volatile assets` };
  }

  private calculateComplexityRisk(positions: Position[], chains: string[]): { value: number; description: string } {
    const chainCount = new Set(positions.map(p => p.chain)).size;
    const value = (chains.length - chainCount) * 15 + 20;
    return { value: Math.max(0, Math.min(100, value)), description: `${chainCount} chains used` };
  }

  private getRiskLevel(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' {
    if (score < 20) return 'A+';
    if (score < 35) return 'A';
    if (score < 50) return 'B+';
    if (score < 65) return 'B';
    if (score < 80) return 'C';
    if (score < 90) return 'D';
    return 'F';
  }

  private getProtocolRiskFactors(protocol: string): string[] {
    const factors = ['Smart Contract Risk', 'Liquidity Risk', 'Market Risk', 'Governance Risk', 'Centralization Risk'];
    const numFactors = Math.floor(Math.random() * 3) + 1;
    return factors.slice(0, numFactors);
  }

  private getScenarioDescription(scenario: string): string {
    const descriptions: Record<string, string> = {
      market_crash_20: '20% market decline across all assets',
      market_crash_40: '40% market decline simulating severe bear market',
      stablecoin_depeg: 'Stablecoin de-peg event (20% loss)',
      liquidity_crisis: 'DeFi liquidity crisis with 25% impact',
      single_protocol_fail: 'Single protocol failure (15% impact)',
    };
    return descriptions[scenario] || 'Custom stress scenario';
  }

  private generateRecommendations(
    concentration: { value: number },
    diversification: { value: number },
    protocol: { value: number },
    liquidity: { value: number },
    volatility: { value: number },
    complexity: { value: number }
  ): string[] {
    const recommendations: string[] = [];
    
    if (concentration.value > 60) {
      recommendations.push('Reduce concentration in top holdings');
    }
    if (diversification.value > 60) {
      recommendations.push('Add more diverse assets to portfolio');
    }
    if (protocol.value > 50) {
      recommendations.push('Spread exposure across multiple protocols');
    }
    if (liquidity.value > 50) {
      recommendations.push('Consider adding more liquid assets');
    }
    if (volatility.value > 60) {
      recommendations.push('Reduce exposure to high volatility assets');
    }
    if (complexity.value > 60) {
      recommendations.push('Simplify cross-chain complexity');
    }

    if (recommendations.length === 0) {
      recommendations.push('Portfolio risk profile is well balanced');
    }

    return recommendations;
  }
}

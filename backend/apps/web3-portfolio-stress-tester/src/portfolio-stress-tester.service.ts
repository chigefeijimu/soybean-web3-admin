import { Injectable } from '@nestjs/common';
import { 
  StressTestRequestDto, 
  StressTestResultDto,
  PortfolioSnapshotDto,
  ScenarioConfigDto,
  HistoricalCrashDto,
  StressTestSummaryDto,
  StressScenarioDto,
  AssetAllocationDto,
  RiskMetricsDto
} from './dto/stress-test.dto';

// Historical market crashes for reference
const HISTORICAL_CRASHES: HistoricalCrashDto[] = [
  {
    id: 'crash-2022-nov',
    name: 'FTX Collapse',
    date: '2022-11-08',
    description: 'FTX exchange collapse caused massive crypto market crash',
    severity: 'severe',
    btcDrop: -25.5,
    ethDrop: -32.0,
    marketCapLoss: 150_000_000_000,
    duration: '2 weeks',
    recoveryTime: '3 months'
  },
  {
    id: 'crash-2022-may',
    name: 'Terra Luna Crash',
    date: '2022-05-09',
    description: 'Terra Luna stablecoin depeg and collapse',
    severity: 'critical',
    btcDrop: -18.2,
    ethDrop: -45.0,
    marketCapLoss: 80_000_000_000,
    duration: '1 week',
    recoveryTime: '6 months'
  },
  {
    id: 'crash-2020-mar',
    name: 'COVID Crash',
    date: '2020-03-12',
    description: 'Global pandemic panic caused markets to crash',
    severity: 'severe',
    btcDrop: -37.5,
    ethDrop: -42.0,
    marketCapLoss: 200_000_000_000,
    duration: '2 days',
    recoveryTime: '2 months'
  },
  {
    id: 'crash-2018-dec',
    name: 'Crypto Winter',
    date: '2018-12-15',
    description: 'Extended bear market after 2017 bull run',
    severity: 'severe',
    btcDrop: -80.0,
    ethDrop: -92.0,
    marketCapLoss: 700_000_000_000,
    duration: '1 year',
    recoveryTime: '3 years'
  },
  {
    id: 'crash-2017-dec',
    name: 'BTC Hard Fork',
    date: '2017-12-17',
    description: 'Bitcoin peak and subsequent crash',
    severity: 'high',
    btcDrop: -65.0,
    ethDrop: -80.0,
    marketCapLoss: 400_000_000_000,
    duration: '3 months',
    recoveryTime: '2 years'
  },
  {
    id: 'crash-2021-may',
    name: 'China Mining Ban',
    date: '2021-05-19',
    description: 'China crypto mining ban caused market crash',
    severity: 'high',
    btcDrop: -50.0,
    ethDrop: -60.0,
    marketCapLoss: 300_000_000_000,
    duration: '2 months',
    recoveryTime: '4 months'
  },
  {
    id: 'crash-2021-nov',
    name: 'Omicron & Rate Hikes',
    date: '2021-11-10',
    description: 'COVID variant and Fed rate hike fears',
    severity: 'high',
    btcDrop: -47.0,
    ethDrop: -55.0,
    marketCapLoss: 250_000_000_000,
    duration: '1 month',
    recoveryTime: '5 months'
  },
  {
    id: 'crash-2023-mar',
    name: 'Banking Crisis',
    date: '2023-03-10',
    description: 'Silvergate and SVB bank failures',
    severity: 'medium',
    btcDrop: -15.0,
    ethDrop: -12.0,
    marketCapLoss: 80_000_000_000,
    duration: '1 week',
    recoveryTime: '1 month'
  },
  {
    id: 'crash-2024-aug',
    name: 'Summer Correction',
    date: '2024-08-01',
    description: 'Summer market correction and Japan rate hike',
    severity: 'medium',
    btcDrop: -22.0,
    ethDrop: -28.0,
    marketCapLoss: 150_000_000_000,
    duration: '2 weeks',
    recoveryTime: '2 months'
  },
  {
    id: 'crash-2025-jan',
    name: 'AI Bubble Burst',
    date: '2025-01-15',
    description: 'AI token bubble burst and profit taking',
    severity: 'high',
    btcDrop: -30.0,
    ethDrop: -38.0,
    marketCapLoss: 200_000_000_000,
    duration: '1 month',
    recoveryTime: '3 months'
  }
];

// Supported chains
const SUPPORTED_CHAINS = [
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'
];

@Injectable()
export class PortfolioStressTesterService {

  async runStressTest(dto: StressTestRequestDto): Promise<StressTestResultDto> {
    const portfolio = await this.getPortfolioSnapshot(dto.address, dto.chains);
    const scenarios = this.generateScenarios(dto.scenarios);
    
    const results = scenarios.map(scenario => {
      const impact = this.calculateScenarioImpact(portfolio, scenario);
      return {
        scenario,
        impact,
        recommendations: this.generateRecommendations(impact, scenario)
      };
    });

    const riskMetrics = this.calculateRiskMetrics(portfolio, results);

    return {
      address: dto.address,
      portfolioSnapshot: portfolio,
      scenarios: results,
      riskMetrics,
      overallScore: this.calculateOverallScore(riskMetrics),
      timestamp: new Date().toISOString()
    };
  }

  async getStressSummary(address: string, chains?: string[]): Promise<StressTestSummaryDto> {
    const portfolio = await this.getPortfolioSnapshot(address, chains);
    
    // Quick stress scenarios
    const quickScenarios: StressScenarioDto[] = [
      { id: 'market-crash-30', name: '30% Market Crash', type: 'market_crash', severity: 30, probability: 0.15 },
      { id: 'market-crash-50', name: '50% Market Crash', type: 'market_crash', severity: 50, probability: 0.08 },
      { id: 'stablecoin-depeg', name: 'Stablecoin Depeg', type: 'stablecoin_depeg', severity: 40, probability: 0.05 },
      { id: 'liquidity-crisis', name: 'Liquidity Crisis', type: 'liquidity_crisis', severity: 35, probability: 0.03 },
      { id: 'correlation-breakdown', name: 'Correlation Breakdown', type: 'correlation_breakdown', severity: 25, probability: 0.10 }
    ];

    const quickResults = quickScenarios.map(scenario => ({
      scenario,
      impact: this.calculateScenarioImpact(portfolio, scenario)
    }));

    const riskMetrics = this.calculateRiskMetrics(portfolio, quickResults);

    return {
      address,
      portfolioValue: portfolio.totalValue,
      overallScore: this.calculateOverallScore(riskMetrics),
      riskLevel: this.getRiskLevel(riskMetrics.compositeScore),
      topRisks: this.getTopRisks(quickResults),
      quickResults,
      timestamp: new Date().toISOString()
    };
  }

  async runCustomScenario(dto: ScenarioConfigDto): Promise<any> {
    const portfolio = await this.getPortfolioSnapshot(dto.address, dto.chains);
    const scenario: StressScenarioDto = {
      id: 'custom',
      name: dto.name,
      type: dto.type,
      severity: dto.severity,
      probability: dto.probability,
      parameters: dto.parameters
    };

    const impact = this.calculateScenarioImpact(portfolio, scenario);
    const recommendations = this.generateRecommendations(impact, scenario);

    return {
      scenario,
      impact,
      recommendations,
      portfolioSnapshot: portfolio,
      timestamp: new Date().toISOString()
    };
  }

  async getHistoricalCrashes(limit: number): Promise<HistoricalCrashDto[]> {
    return HISTORICAL_CRASHES.slice(0, limit);
  }

  async getPortfolioSnapshot(address: string, chains?: string[]): Promise<PortfolioSnapshotDto> {
    const chainList = chains && chains.length > 0 ? chains : SUPPORTED_CHAINS;
    
    // Simulate portfolio data
    const assets: AssetAllocationDto[] = [
      { symbol: 'ETH', name: 'Ethereum', amount: 5.2, value: 12500, chain: 'ethereum', category: 'layer1', allocation: 31.25, volatility: 0.65 },
      { symbol: 'BTC', name: 'Bitcoin', amount: 0.15, value: 9500, chain: 'ethereum', category: 'layer1', allocation: 23.75, volatility: 0.55 },
      { symbol: 'USDC', name: 'USD Coin', amount: 5000, value: 5000, chain: 'ethereum', category: 'stablecoin', allocation: 12.5, volatility: 0.01 },
      { symbol: 'USDT', name: 'Tether', amount: 3000, value: 3000, chain: 'polygon', category: 'stablecoin', allocation: 7.5, volatility: 0.01 },
      { symbol: 'AAVE', name: 'Aave', amount: 50, value: 2500, chain: 'ethereum', category: 'defi', allocation: 6.25, volatility: 0.75 },
      { symbol: 'UNI', name: 'Uniswap', amount: 200, value: 1800, chain: 'ethereum', category: 'defi', allocation: 4.5, volatility: 0.70 },
      { symbol: 'LINK', name: 'Chainlink', amount: 100, value: 1200, chain: 'arbitrum', category: 'defi', allocation: 3.0, volatility: 0.60 },
      { symbol: 'MATIC', name: 'Polygon', amount: 3000, value: 2700, chain: 'polygon', category: 'layer1', allocation: 6.75, volatility: 0.72 },
      { symbol: 'ARB', name: 'Arbitrum', amount: 1500, value: 1200, chain: 'arbitrum', category: 'layer1', allocation: 3.0, volatility: 0.78 },
      { symbol: 'OP', name: 'Optimism', amount: 600, value: 600, chain: 'optimism', category: 'layer1', allocation: 1.5, volatility: 0.75 }
    ];

    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
    const stablecoinValue = assets.filter(a => a.category === 'stablecoin').reduce((sum, a) => sum + a.value, 0);
    const defiValue = assets.filter(a => a.category === 'defi').reduce((sum, a) => sum + a.value, 0);
    const layer1Value = assets.filter(a => a.category === 'layer1').reduce((sum, a) => sum + a.value, 0);

    // Update allocations based on actual values
    assets.forEach(a => {
      a.allocation = (a.value / totalValue) * 100;
    });

    return {
      address,
      totalValue,
      assets,
      chains: chainList,
      categories: {
        stablecoin: { value: stablecoinValue, percentage: (stablecoinValue / totalValue) * 100 },
        defi: { value: defiValue, percentage: (defiValue / totalValue) * 100 },
        layer1: { value: layer1Value, percentage: (layer1Value / totalValue) * 100 },
        nft: { value: 0, percentage: 0 }
      },
      timestamp: new Date().toISOString()
    };
  }

  async comparePortfolios(addresses: string[]): Promise<any> {
    const results = await Promise.all(
      addresses.map(async (address) => {
        const summary = await this.getStressSummary(address);
        return { address, summary };
      })
    );

    return {
      comparison: results.map(r => ({
        address: r.address,
        portfolioValue: r.summary.portfolioValue,
        overallScore: r.summary.overallScore,
        riskLevel: r.summary.riskLevel
      })),
      ranking: results
        .sort((a, b) => b.summary.overallScore - a.summary.overallScore)
        .map((r, i) => ({ rank: i + 1, address: r.address, score: r.summary.overallScore })),
      timestamp: new Date().toISOString()
    };
  }

  private generateScenarios(scenarios?: string[]): StressScenarioDto[] {
    const defaultScenarios: StressScenarioDto[] = [
      { id: 'market-crash-20', name: '20% Market Crash', type: 'market_crash', severity: 20, probability: 0.20 },
      { id: 'market-crash-40', name: '40% Market Crash', type: 'market_crash', severity: 40, probability: 0.10 },
      { id: 'market-crash-60', name: '60% Market Crash', type: 'market_crash', severity: 60, probability: 0.05 },
      { id: 'stablecoin-depeg', name: 'Stablecoin Depeg (USDC/USDT)', type: 'stablecoin_depeg', severity: 40, probability: 0.05 },
      { id: 'eth-crash', name: 'Ethereum Flash Crash', type: 'single_asset_crash', severity: 50, probability: 0.08, affectedAsset: 'ETH' },
      { id: 'btc-crash', name: 'Bitcoin Flash Crash', type: 'single_asset_crash', severity: 45, probability: 0.08, affectedAsset: 'BTC' },
      { id: 'defi-crash', name: 'DeFi Protocol Collapse', type: 'defi_collapse', severity: 60, probability: 0.03 },
      { id: 'liquidity-crisis', name: 'DEX Liquidity Crisis', type: 'liquidity_crisis', severity: 35, probability: 0.05 },
      { id: 'correlation-breakdown', name: 'All Assets Correlate', type: 'correlation_breakdown', severity: 25, probability: 0.10 },
      { id: 'regulatory-crackdown', name: 'Regulatory Crackdown', type: 'regulatory', severity: 50, probability: 0.05 }
    ];

    if (!scenarios || scenarios.length === 0) {
      return defaultScenarios;
    }

    return defaultScenarios.filter(s => scenarios.includes(s.id));
  }

  private calculateScenarioImpact(portfolio: PortfolioSnapshotDto, scenario: StressScenarioDto): any {
    const { assets, categories, totalValue } = portfolio;
    let totalImpact = 0;
    const assetImpacts: any[] = [];

    assets.forEach(asset => {
      let impact: number;
      
      switch (scenario.type) {
        case 'market_crash':
          // Layer1 tokens bear the brunt
          if (asset.category === 'layer1') {
            impact = -scenario.severity * (1 + asset.volatility * 0.2);
          } else if (asset.category === 'defi') {
            impact = -scenario.severity * 1.2;
          } else if (asset.category === 'stablecoin') {
            impact = -scenario.severity * 0.1;
          }
          break;
          
        case 'stablecoin_depeg':
          if (asset.category === 'stablecoin') {
            impact = -scenario.severity;
          } else if (asset.category === 'defi') {
            impact = -scenario.severity * 0.5;
          }
          break;
          
        case 'single_asset_crash':
          if (asset.symbol === scenario.affectedAsset) {
            impact = -scenario.severity;
          } else if (asset.category === 'defi') {
            impact = -scenario.severity * 0.3;
          }
          break;
          
        case 'defi_collapse':
          if (asset.category === 'defi') {
            impact = -scenario.severity;
          } else if (asset.category === 'layer1') {
            impact = -scenario.severity * 0.4;
          }
          break;
          
        case 'liquidity_crisis':
          if (asset.category === 'defi') {
            impact = -scenario.severity * 0.8;
          }
          break;
          
        case 'correlation_breakdown':
          // All assets fall together
          impact = -scenario.severity;
          break;
          
        case 'regulatory':
          if (asset.category === 'defi') {
            impact = -scenario.severity * 1.2;
          } else if (asset.category === 'stablecoin') {
            impact = -scenario.severity * 0.8;
          }
          break;
          
        default:
          impact = -scenario.severity;
      }

      impact = impact || -scenario.severity * 0.5; // Default impact
      
      const valueLoss = asset.value * (impact / 100);
      totalImpact += valueLoss;
      
      assetImpacts.push({
        symbol: asset.symbol,
        originalValue: asset.value,
        impactedValue: Math.max(0, asset.value + valueLoss),
        impact: impact,
        valueLoss
      });
    });

    const impactPercentage = (totalImpact / totalValue) * 100;
    const remainingValue = totalValue + totalImpact;

    return {
      totalImpact,
      impactPercentage,
      remainingValue,
      assetImpacts,
      affectedAssets: assetImpacts.filter(a => a.impact < 0).length,
      highlyAffected: assetImpacts.filter(a => a.impact < -30).map(a => a.symbol)
    };
  }

  private calculateRiskMetrics(portfolio: PortfolioSnapshotDto, results: any[]): RiskMetricsDto {
    const { categories, totalValue } = portfolio;
    
    // Diversification score (0-100)
    const categoryCount = Object.keys(categories).filter(k => categories[k].value > 0).length;
    const diversificationScore = Math.min(100, categoryCount * 33);
    
    // Stablecoin ratio (higher is safer)
    const stablecoinRatio = (categories.stablecoin?.value || 0) / totalValue;
    const stabilityScore = Math.min(100, stablecoinRatio * 200);
    
    // Concentration risk (highest single asset)
    const maxAllocation = Math.max(...portfolio.assets.map(a => a.allocation));
    const concentrationRisk = maxAllocation > 30 ? 'high' : maxAllocation > 20 ? 'medium' : 'low';
    const concentrationScore = maxAllocation > 30 ? 30 : maxAllocation > 20 ? 60 : 100;
    
    // Average volatility exposure
    const avgVolatility = portfolio.assets.reduce((sum, a) => sum + a.volatility * a.allocation, 0) / 100;
    const volatilityScore = Math.max(0, 100 - avgVolatility * 100);
    
    // Defi exposure risk
    const defiExposure = (categories.defi?.value || 0) / totalValue;
    const defiRiskScore = defiExposure > 0.5 ? 30 : defiExposure > 0.3 ? 60 : 100;
    
    // Calculate scenario impacts
    const avgImpact = results.reduce((sum, r) => sum + Math.abs(r.impact.impactPercentage), 0) / results.length;
    const worstCase = Math.max(...results.map(r => Math.abs(r.impact.impactPercentage)));
    const bestCase = Math.min(...results.map(r => Math.abs(r.impact.impactPercentage)));
    
    const compositeScore = Math.round(
      (diversificationScore * 0.2 + 
       stabilityScore * 0.2 + 
       concentrationScore * 0.2 + 
       volatilityScore * 0.2 + 
       defiRiskScore * 0.2)
    );

    return {
      diversificationScore,
      stabilityScore,
      concentrationScore,
      volatilityScore,
      defiRiskScore,
      compositeScore,
      avgImpact,
      worstCase,
      bestCase,
      stablecoinRatio,
      maxAllocation,
      avgVolatility,
      defiExposure,
      concentrationRisk
    };
  }

  private calculateOverallScore(riskMetrics: RiskMetricsDto): number {
    // Lower is better for risk - convert to stress resistance score (0-100)
    const score = Math.max(0, Math.min(100, riskMetrics.compositeScore));
    return score;
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private getTopRisks(results: any[]): string[] {
    const sorted = [...results].sort((a, b) => 
      Math.abs(b.impact.impactPercentage) - Math.abs(a.impact.impactPercentage)
    );
    return sorted.slice(0, 3).map(r => r.scenario.name);
  }

  private generateRecommendations(impact: any, scenario: StressScenarioDto): string[] {
    const recommendations: string[] = [];
    
    if (impact.impactPercentage > 40) {
      recommendations.push('⚠️ High risk exposure - Consider reducing allocation to high-volatility assets');
    }
    
    if (impact.affectedAssets > 5) {
      recommendations.push('📊 Portfolio is too correlated - Diversify across more asset categories');
    }
    
    if (impact.highlyAffected.length > 0) {
      recommendations.push(`🎯 Reduce ${impact.highlyAffected.join(', ')} exposure to minimize single-point failures`);
    }
    
    if (scenario.type === 'stablecoin_depeg') {
      recommendations.push('💰 Consider diversifying stablecoins across multiple issuers');
      recommendations.push('🏦 Add non-correlated assets like gold or real estate tokens');
    }
    
    if (scenario.type === 'defi_collapse') {
      recommendations.push('🔧 Limit DeFi protocol exposure to <30% of portfolio');
      recommendations.push('📈 Use insurance protocols for high-value DeFi positions');
    }
    
    if (scenario.type === 'liquidity_crisis') {
      recommendations.push('💵 Maintain at least 20% in liquid, easily-sellable assets');
    }
    
    // General recommendations
    recommendations.push('🛡️ Consider using stop-loss orders for volatile assets');
    recommendations.push('📅 Review portfolio stress test results quarterly');
    
    return recommendations;
  }
}

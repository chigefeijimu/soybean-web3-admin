import { Injectable } from '@nestjs/common';

interface PortfolioPosition {
  token: string;
  chain: string;
  amount: number;
  valueUSD: number;
  type: 'token' | 'lp' | 'staking' | 'lending' | 'nft';
}

interface SimulationResult {
  id: string;
  timestamp: number;
  initialValue: number;
  finalValue: number;
  return: number;
  returnPercent: number;
  apy: number;
  risks: RiskMetrics;
  details: SimulationDetail[];
}

interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number;
  riskScore: number;
}

interface SimulationDetail {
  step: number;
  action: string;
  valueBefore: number;
  valueAfter: number;
  change: number;
}

@Injectable()
export class DefiPortfolioSimulatorService {
  private scenarios = new Map<string, any>();

  // Supported strategies
  private strategies = [
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Focus on stablecoins and low-risk staking',
      riskLevel: 'low',
      expectedApy: { min: 3, max: 8 },
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Mix of stablecoins and blue-chip DeFi tokens',
      riskLevel: 'medium',
      expectedApy: { min: 8, max: 20 },
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      description: 'High-yield farming and leverage strategies',
      riskLevel: 'high',
      expectedApy: { min: 20, max: 100 },
    },
    {
      id: 'lp_farming',
      name: 'LP Farming',
      description: 'Concentrated liquidity provision strategies',
      riskLevel: 'medium-high',
      expectedApy: { min: 15, max: 50 },
    },
    {
      id: 'lending',
      name: 'Lending',
      description: 'Supply assets to lending protocols',
      riskLevel: 'low',
      expectedApy: { min: 2, max: 12 },
    },
    {
      id: 'staking',
      name: 'Staking',
      description: 'Proof-of-stake token staking',
      riskLevel: 'low',
      expectedApy: { min: 3, max: 15 },
    },
  ];

  // Chain configs
  private chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'];

  // Protocol configs with base APYs
  private protocols = {
    aave: { chain: 'ethereum', baseApy: 5.2, type: 'lending' },
    compound: { chain: 'ethereum', baseApy: 4.8, type: 'lending' },
    uniswap: { chain: 'ethereum', baseApy: 15, type: 'lp' },
    curve: { chain: 'ethereum', baseApy: 8, type: 'lp' },
    lido: { chain: 'ethereum', baseApy: 3.5, type: 'staking' },
    rocketpool: { chain: 'ethereum', baseApy: 4.2, type: 'staking' },
    'aave-polygon': { chain: 'polygon', baseApy: 8.5, type: 'lending' },
    'quickwap': { chain: 'polygon', baseApy: 12, type: 'lp' },
    'sushiswap-arbitrum': { chain: 'arbitrum', baseApy: 18, type: 'lp' },
    'aerodrome': { chain: 'base', baseApy: 20, type: 'lp' },
    'trader-joe': { chain: 'avalanche', baseApy: 14, type: 'lp' },
  };

  async getCurrentPortfolio(address: string): Promise<any> {
    // Generate mock portfolio data
    const positions: PortfolioPosition[] = [
      { token: 'ETH', chain: 'ethereum', amount: 2.5, valueUSD: 6250, type: 'token' },
      { token: 'USDC', chain: 'ethereum', amount: 10000, valueUSD: 10000, type: 'token' },
      { token: 'USDT', chain: 'polygon', amount: 5000, valueUSD: 5000, type: 'token' },
      { token: 'WBTC', chain: 'ethereum', amount: 0.15, valueUSD: 9000, type: 'token' },
      { token: 'UNI', chain: 'ethereum', amount: 500, valueUSD: 4500, type: 'token' },
      { token: 'AAVE', chain: 'ethereum', amount: 50, valueUSD: 6500, type: 'token' },
      { token: 'stETH', chain: 'ethereum', amount: 3, valueUSD: 7500, type: 'staking' },
      { token: 'USDC LP', chain: 'arbitrum', amount: 15000, valueUSD: 15000, type: 'lp' },
    ];

    const totalValue = positions.reduce((sum, p) => sum + p.valueUSD, 0);

    return {
      address,
      totalValue,
      positions,
      allocation: {
        tokens: 39750,
        staking: 7500,
        lp: 15000,
        lending: 0,
        nft: 0,
      },
      chains: this.chains.map(chain => ({
        name: chain,
        value: positions.filter(p => p.chain === chain).reduce((sum, p) => sum + p.valueUSD, 0),
      })),
      riskScore: 45,
    };
  }

  async simulatePortfolio(dto: any): Promise<SimulationResult> {
    const { address, actions, initialValue = 50000 } = dto;
    
    let currentValue = initialValue;
    const details: SimulationDetail[] = [];
    
    // Simulate each action
    actions.forEach((action: any, index: number) => {
      const valueBefore = currentValue;
      const changePercent = (Math.random() - 0.3) * 0.2; // -4% to +16% per action
      const change = currentValue * changePercent;
      currentValue += change;
      
      details.push({
        step: index + 1,
        action: action.type,
        valueBefore,
        valueAfter: currentValue,
        change,
      });
    });

    const returnAmount = currentValue - initialValue;
    const returnPercent = (returnAmount / initialValue) * 100;
    const days = actions.length || 30;
    const apy = (Math.pow(1 + returnPercent / 100, 365 / days) - 1) * 100;

    const result: SimulationResult = {
      id: `sim_${Date.now()}`,
      timestamp: Date.now(),
      initialValue,
      finalValue: currentValue,
      return: returnAmount,
      returnPercent,
      apy,
      risks: this.calculateRiskMetrics(initialValue, currentValue),
      details,
    };

    return result;
  }

  async createScenario(dto: any): Promise<any> {
    const scenarioId = `scenario_${Date.now()}`;
    const scenario = {
      id: scenarioId,
      ...dto,
      createdAt: Date.now(),
    };
    
    this.scenarios.set(scenarioId, scenario);
    return scenario;
  }

  async getScenarios(address: string): Promise<any[]> {
    return Array.from(this.scenarios.values()).filter(
      (s: any) => s.address === address
    );
  }

  async compareScenarios(scenarioIds: string): Promise<any> {
    const ids = scenarioIds.split(',');
    const scenarios = ids.map(id => this.scenarios.get(id)).filter(Boolean);
    
    if (scenarios.length === 0) {
      return { error: 'No scenarios found' };
    }

    return {
      scenarios: scenarios.map((s: any) => ({
        id: s.id,
        name: s.name,
        initialValue: s.initialValue,
        finalValue: s.expectedReturn || s.initialValue * 1.1,
        return: (s.expectedReturn || s.initialValue * 0.1) - s.initialValue,
        riskLevel: s.riskLevel,
      })),
      comparison: {
        bestReturn: Math.max(...scenarios.map((s: any) => s.expectedReturn || s.initialValue * 1.1)),
        lowestRisk: scenarios.sort((a: any, b: any) => 
          (a.riskLevel === 'low' ? 1 : a.riskLevel === 'medium' ? 2 : 3) - 
          (b.riskLevel === 'low' ? 1 : b.riskLevel === 'medium' ? 2 : 3)
        )[0]?.id,
      },
    };
  }

  async getStrategies(): Promise<any[]> {
    return this.strategies;
  }

  async historicalBacktest(address: string, strategy: string, period: string = '30d'): Promise<any> {
    const days = period === '30d' ? 30 : period === '90d' ? 90 : period === '180d' ? 180 : 365;
    const strat = this.strategies.find(s => s.id === strategy) || this.strategies[1];
    
    // Generate historical data
    const data = [];
    let value = 50000;
    const dailyReturn = (strat.expectedApy.max + strat.expectedApy.min) / 2 / 365;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const volatility = (Math.random() - 0.5) * 0.05;
      value = value * (1 + dailyReturn + volatility);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value,
        change: (value - 50000) / 50000 * 100,
      });
    }

    const finalValue = data[data.length - 1].value;
    const totalReturn = (finalValue - 50000) / 50000 * 100;

    return {
      strategy,
      period,
      initialValue: 50000,
      finalValue,
      totalReturn,
      apy: (Math.pow(finalValue / 50000, 365 / days) - 1) * 100,
      data,
      metrics: {
        volatility: Math.random() * 20 + 10,
        sharpeRatio: Math.random() * 2 + 0.5,
        maxDrawdown: Math.random() * 15 + 5,
      },
    };
  }

  async yieldProjection(amount: number, strategy: string, duration: number): Promise<any> {
    const strat = this.strategies.find(s => s.id === strategy) || this.strategies[1];
    const avgApy = (strat.expectedApy.min + strat.expectedApy.max) / 2;
    
    // Daily compound projection
    const dailyData = [];
    let currentValue = amount;
    const dailyRate = avgApy / 100 / 365;
    
    for (let day = 1; day <= duration; day++) {
      currentValue = currentValue * (1 + dailyRate);
      
      if (day % 7 === 0 || day === duration) {
        dailyData.push({
          day,
          value: currentValue,
          profit: currentValue - amount,
          returnPercent: ((currentValue - amount) / amount) * 100,
        });
      }
    }

    // Calculate different scenarios
    const bestCase = amount * Math.pow(1 + strat.expectedApy.max / 100 / 365, duration);
    const worstCase = amount * Math.pow(1 + strat.expectedApy.min / 100 / 365, duration);

    return {
      strategy: strat.name,
      initialAmount: amount,
      duration,
      expected: {
        finalValue: currentValue,
        profit: currentValue - amount,
        apy: avgApy,
      },
      bestCase: {
        finalValue: bestCase,
        profit: bestCase - amount,
        apy: strat.expectedApy.max,
      },
      worstCase: {
        finalValue: worstCase,
        profit: worstCase - amount,
        apy: strat.expectedApy.min,
      },
      projection: dailyData,
    };
  }

  async analyzeRisk(portfolioData: any): Promise<any> {
    const { positions = [] } = portfolioData;
    
    // Calculate risk metrics
    const totalValue = positions.reduce((sum: number, p: any) => sum + (p.valueUSD || 0), 0);
    
    // Concentration risk
    const sortedPositions = [...positions].sort((a: any, b: any) => (b.valueUSD || 0) - (a.valueUSD || 0));
    const topPositionRatio = sortedPositions[0]?.valueUSD ? sortedPositions[0].valueUSD / totalValue : 0;
    
    // Diversity score
    const uniqueChains = new Set(positions.map((p: any) => p.chain)).size;
    const uniqueTypes = new Set(positions.map((p: any) => p.type)).size;
    const diversityScore = Math.min(100, (uniqueChains * 10 + uniqueTypes * 15));
    
    // Volatility estimate based on position types
    const typeWeights: Record<string, number> = { token: 0.3, lp: 0.6, staking: 0.2, lending: 0.15, nft: 0.8 };
    const weightedVolatility = positions.reduce((sum: number, p: any) => {
      return sum + (typeWeights[p.type] || 0.3) * (p.valueUSD || 0);
    }, 0) / totalValue * 100;

    const riskScore = Math.min(100, 
      (1 - topPositionRatio) * 30 + 
      (100 - diversityScore) * 0.3 + 
      weightedVolatility * 0.4
    );

    return {
      overallRiskScore: Math.round(riskScore),
      riskLevel: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
      metrics: {
        concentrationRisk: Math.round((1 - topPositionRatio) * 100),
        diversityScore: Math.round(diversityScore),
        volatilityEstimate: Math.round(weightedVolatility),
        chainDiversity: uniqueChains,
        typeDiversity: uniqueTypes,
      },
      recommendations: this.generateRiskRecommendations(riskScore, uniqueChains, uniqueTypes, topPositionRatio),
    };
  }

  async stressTest(address: string, scenario: string): Promise<any> {
    const portfolio = await this.getCurrentPortfolio(address);
    const totalValue = portfolio.totalValue;
    
    // Define stress scenarios
    const scenarioImpacts: Record<string, number> = {
      market_crash: 0.4,      // 40% drop
      liquidity_crisis: 0.25,  // 25% drop
      stablecoin_depeg: 0.15,  // 15% drop (for stablecoin portions)
      inflation_spike: 0.20,  // 20% drop
      regulatory_crackdown: 0.35, // 35% drop
    };
    
    const impact = scenarioImpacts[scenario] || 0.3;
    const stressedValue = totalValue * (1 - impact);
    const loss = totalValue - stressedValue;
    
    // Affected positions
    const affectedPositions = portfolio.positions.map((p: any) => {
      let affected = false;
      if (scenario === 'stablecoin_depeg' && ['USDC', 'USDT', 'DAI'].includes(p.token)) {
        affected = true;
      } else if (['market_crash', 'liquidity_crisis', 'inflation_spike', 'regulatory_crackdown'].includes(scenario)) {
        affected = true;
      }
      
      return {
        ...p,
        stressedValue: affected ? p.valueUSD * (1 - impact) : p.valueUSD,
        impact: affected ? -(p.valueUSD * impact) : 0,
      };
    });

    return {
      scenario,
      originalValue: totalValue,
      stressedValue,
      loss,
      lossPercent: impact * 100,
      recoveryTime: this.estimateRecoveryTime(scenario),
      affectedPositions,
      recommendations: this.generateStressRecommendations(scenario, affectedPositions),
    };
  }

  private calculateRiskMetrics(initialValue: number, finalValue: number): RiskMetrics {
    const returnPercent = ((finalValue - initialValue) / initialValue) * 100;
    const volatility = Math.random() * 20 + 10;
    const sharpeRatio = returnPercent / volatility;
    const maxDrawdown = Math.random() * 15 + 5;
    const var95 = initialValue * 0.05 * (1 + Math.random());

    return {
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      var95: Math.round(var95 * 100) / 100,
      riskScore: Math.min(100, Math.max(0, Math.round(50 + (volatility - 15) * 2))),
    };
  }

  private generateRiskRecommendations(riskScore: number, chainDiversity: number, typeDiversity: number, concentration: number): string[] {
    const recommendations = [];
    
    if (concentration > 0.4) {
      recommendations.push('⚠️ High concentration risk: Your largest position represents over 40% of portfolio. Consider diversifying.');
    }
    if (chainDiversity < 4) {
      recommendations.push('🌐 Limited chain diversity: Consider spreading positions across more chains for better risk management.');
    }
    if (typeDiversity < 3) {
      recommendations.push('📊 Limited asset type diversity: Add different position types (staking, lending, LP) for better risk management.');
    }
    if (riskScore > 60) {
      recommendations.push('🔴 High overall risk: Consider reducing exposure to high-volatility positions.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Your portfolio has good risk diversification!');
    }
    
    return recommendations;
  }

  private estimateRecoveryTime(scenario: string): string {
    const recoveryTimes: Record<string, string> = {
      market_crash: '6-12 months',
      liquidity_crisis: '3-6 months',
      stablecoin_depeg: '1-3 months',
      inflation_spike: '12-24 months',
      regulatory_crackdown: '12-36 months',
    };
    return recoveryTimes[scenario] || '6-12 months';
  }

  private generateStressRecommendations(scenario: string, affectedPositions: any[]): string[] {
    const recommendations = [];
    
    switch (scenario) {
      case 'market_crash':
        recommendations.push('Consider adding more stablecoins as a hedge');
        recommendations.push('Look for buying opportunities in quality assets');
        break;
      case 'liquidity_crisis':
        recommendations.push('Ensure you have sufficient stablecoin reserves');
        recommendations.push('Avoid withdrawing from liquidity positions during crisis');
        break;
      case 'stablecoin_depeg':
        recommendations.push('Diversify stablecoin holdings across multiple protocols');
        recommendations.push('Consider converting some stablecoins to ETH or BTC');
        break;
    }
    
    return recommendations;
  }
}

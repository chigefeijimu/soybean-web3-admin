import { Injectable } from '@nestjs/common';

interface ProtocolRisk {
  name: string;
  category: string;
  tvl: number;
  auditScore: number;
  age: number;
  governance: string;
  tvlChange24h: number;
  numExploits: number;
  communityTrust: number;
}

interface Position {
  protocol: string;
  chain: string;
  type: string;
  value: number;
  apy: number;
}

interface RiskResult {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    category: string;
    weight: number;
    score: number;
    contribution: number;
  }[];
  recommendations: string[];
  protocolBreakdown: {
    protocol: string;
    score: number;
    issues: string[];
  }[];
  diversificationScore: number;
  concentrationRisk: number;
  smartContractRisk: number;
  liquidityRisk: number;
  impermanentLossRisk: number;
}

@Injectable()
export class DefiRiskCalculatorService {
  private protocols: ProtocolRisk[] = [
    { name: 'Aave', category: 'Lending', tvl: 15000000000, auditScore: 95, age: 7, governance: 'decentralized', tvlChange24h: 2.5, numExploits: 1, communityTrust: 90 },
    { name: 'Compound', category: 'Lending', tvl: 2800000000, auditScore: 92, age: 7, governance: 'decentralized', tvlChange24h: 1.2, numExploits: 0, communityTrust: 88 },
    { name: 'Uniswap', category: 'DEX', tvl: 4500000000, auditScore: 90, age: 6, governance: 'decentralized', tvlChange24h: 3.1, numExploits: 2, communityTrust: 92 },
    { name: 'Curve', category: 'DEX', tvl: 2200000000, auditScore: 88, age: 5, governance: 'decentralized', tvlChange24h: 1.8, numExploits: 1, communityTrust: 85 },
    { name: 'Yearn', category: 'Yield', tvl: 600000000, auditScore: 85, age: 4, governance: 'decentralized', tvlChange24h: -0.5, numExploits: 3, communityTrust: 75 },
    { name: 'Lido', category: 'Staking', tvl: 18000000000, auditScore: 92, age: 4, governance: 'decentralized', tvlChange24h: 4.2, numExploits: 0, communityTrust: 88 },
    { name: 'Rocket Pool', category: 'Staking', tvl: 450000000, auditScore: 90, age: 3, governance: 'decentralized', tvlChange24h: 2.8, numExploits: 0, communityTrust: 82 },
    { name: 'SushiSwap', category: 'DEX', tvl: 400000000, auditScore: 75, age: 4, governance: 'semi-decentralized', tvlChange24h: -1.2, numExploits: 2, communityTrust: 65 },
    { name: 'Convex', category: 'Yield', tvl: 1200000000, auditScore: 82, age: 3, governance: 'semi-decentralized', tvlChange24h: 0.8, numExploits: 1, communityTrust: 72 },
    { name: 'MakerDAO', category: 'Lending', tvl: 8000000000, auditScore: 95, age: 8, governance: 'decentralized', tvlChange24h: 1.5, numExploits: 0, communityTrust: 92 },
    { name: 'AAVE', category: 'Lending', tvl: 15000000000, auditScore: 95, age: 7, governance: 'decentralized', tvlChange24h: 2.5, numExploits: 1, communityTrust: 90 },
    { name: 'Compound', category: 'Lending', tvl: 2800000000, auditScore: 92, age: 7, governance: 'decentralized', tvlChange24h: 1.2, numExploits: 0, communityTrust: 88 },
    { name: 'Synthetix', category: 'Derivatives', tvl: 350000000, auditScore: 88, age: 6, governance: 'decentralized', tvlChange24h: 2.1, numExploits: 2, communityTrust: 80 },
    { name: 'GMX', category: 'Derivatives', tvl: 600000000, auditScore: 80, age: 2, governance: 'semi-decentralized', tvlChange24h: 5.5, numExploits: 0, communityTrust: 78 },
    { name: 'dYdX', category: 'Derivatives', tvl: 400000000, auditScore: 85, age: 4, governance: 'decentralized', tvlChange24h: -2.1, numExploits: 0, communityTrust: 75 },
    { name: 'Morpho', category: 'Lending', tvl: 200000000, auditScore: 88, age: 2, governance: 'decentralized', tvlChange24h: 8.5, numExploits: 0, communityTrust: 80 },
    { name: 'Gearbox', category: 'Leverage', tvl: 150000000, auditScore: 82, age: 2, governance: 'semi-decentralized', tvlChange24h: 3.2, numExploits: 1, communityTrust: 70 },
    { name: 'Pendle', category: 'Yield', tvl: 500000000, auditScore: 78, age: 2, governance: 'semi-decentralized', tvlChange24h: 6.8, numExploits: 0, communityTrust: 72 },
    { name: 'Euler', category: 'Lending', tvl: 100000000, auditScore: 85, age: 2, governance: 'decentralized', tvlChange24h: -5.2, numExploits: 1, communityTrust: 68 },
    { name: 'Abracadabra', category: 'Lending', tvl: 80000000, auditScore: 70, age: 2, governance: 'semi-decentralized', tvlChange24h: -8.5, numExploits: 2, communityTrust: 55 },
  ];

  getSupportedProtocols() {
    return {
      success: true,
      protocols: this.protocols.map(p => ({
        name: p.name,
        category: p.category,
        tvl: p.tvl,
        auditScore: p.auditScore,
        age: p.age,
        governance: p.governance,
      })),
    };
  }

  async analyzePortfolioRisk(address: string, chains: string[]): Promise<any> {
    // Simulate fetching positions from different chains
    const positions = this.generateMockPositions(address, chains);
    return this.calculateRiskScore(positions);
  }

  private generateMockPositions(address: string, chains: string[]): Position[] {
    const protocols = ['Aave', 'Uniswap', 'Compound', 'Curve', 'Lido', 'Yearn'];
    const types = ['Lending', 'LP', 'Staking', 'Yield Farming'];
    
    const positions: Position[] = [];
    chains.forEach((chain, idx) => {
      // Generate 1-3 positions per chain
      const numPositions = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numPositions; i++) {
        positions.push({
          protocol: protocols[Math.floor(Math.random() * protocols.length)],
          chain: chain,
          type: types[Math.floor(Math.random() * types.length)],
          value: Math.floor(Math.random() * 50000) + 1000,
          apy: Math.random() * 15 + 2,
        });
      }
    });
    return positions;
  }

  calculateRiskScore(positions: Position[]): RiskResult {
    if (!positions || positions.length === 0) {
      return {
        overallScore: 100,
        riskLevel: 'low',
        factors: [],
        recommendations: ['Add DeFi positions to analyze risk'],
        protocolBreakdown: [],
        diversificationScore: 100,
        concentrationRisk: 0,
        smartContractRisk: 0,
        liquidityRisk: 0,
        impermanentLossRisk: 0,
      };
    }

    // Calculate protocol-specific risks
    const protocolRisks: { protocol: string; score: number; issues: string[] }[] = [];
    let totalValue = 0;
    
    positions.forEach(pos => {
      const protocol = this.protocols.find(p => p.name.toLowerCase() === pos.protocol.toLowerCase());
      if (protocol) {
        let score = 100;
        const issues: string[] = [];
        
        // Audit score impact
        score -= (100 - protocol.auditScore) * 0.3;
        if (protocol.auditScore < 80) issues.push('Low audit score');
        
        // Exploit history impact
        score -= protocol.numExploits * 8;
        if (protocol.numExploits > 1) issues.push(`History of ${protocol.numExploits} exploits`);
        
        // TVL impact (low TVL = higher risk)
        if (protocol.tvl < 100000000) {
          score -= 10;
          issues.push('Low TVL - potential liquidity risk');
        }
        
        // TVL change impact
        if (protocol.tvlChange24h < -3) {
          score -= 10;
          issues.push('Significant TVL outflow');
        }
        
        // Community trust impact
        score -= (100 - protocol.communityTrust) * 0.15;
        if (protocol.communityTrust < 70) issues.push('Low community trust');
        
        // Governance impact
        if (protocol.governance === 'centralized') {
          score -= 10;
          issues.push('Centralized governance');
        } else if (protocol.governance === 'semi-decentralized') {
          score -= 5;
        }
        
        // Position type specific risks
        if (pos.type === 'LP' || pos.type === 'Yield Farming') {
          score -= 5; // Impermanent loss risk
        }
        if (pos.type === 'Leverage') {
          score -= 15; // Higher risk for leverage
        }
        
        protocolRisks.push({
          protocol: pos.protocol,
          score: Math.max(0, Math.min(100, score)),
          issues,
        });
        
        totalValue += pos.value;
      }
    });

    // Calculate overall risk score
    const avgProtocolScore = protocolRisks.reduce((sum, p) => sum + p.score, 0) / protocolRisks.length;
    
    // Calculate diversification score
    const uniqueProtocols = new Set(positions.map(p => p.protocol)).size;
    const diversificationScore = Math.min(100, uniqueProtocols * 20);
    
    // Concentration risk (larger positions = higher risk)
    const concentrationRisk = positions.reduce((max, pos) => {
      const ratio = (pos.value / totalValue) * 100;
      return Math.max(max, ratio);
    }, 0);
    
    // Smart contract risk (based on audit scores)
    const smartContractRisk = 100 - (this.protocols.reduce((sum, p) => sum + p.auditScore, 0) / this.protocols.length);
    
    // Liquidity risk (based on TVL)
    const liquidityRisk = positions.reduce((sum, pos) => {
      const protocol = this.protocols.find(p => p.name.toLowerCase() === pos.protocol.toLowerCase());
      if (protocol && protocol.tvl < 100000000) {
        return sum + 30;
      }
      return sum;
    }, 0) / positions.length;
    
    // Impermanent loss risk (for LP positions)
    const lpPositions = positions.filter(p => p.type === 'LP' || p.type === 'Yield Farming');
    const impermanentLossRisk = (lpPositions.length / positions.length) * 40;
    
    // Calculate overall score
    let overallScore = avgProtocolScore;
    overallScore -= (100 - diversificationScore) * 0.15;
    overallScore += concentrationRisk * 0.1;
    overallScore += smartContractRisk * 0.2;
    overallScore += liquidityRisk * 0.15;
    overallScore += impermanentLossRisk * 0.1;
    
    overallScore = Math.max(0, Math.min(100, overallScore));
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (overallScore >= 80) riskLevel = 'low';
    else if (overallScore >= 60) riskLevel = 'medium';
    else if (overallScore >= 40) riskLevel = 'high';
    else riskLevel = 'critical';
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (diversificationScore < 50) {
      recommendations.push('Consider diversifying across more protocols to reduce concentration risk');
    }
    if (concentrationRisk > 50) {
      recommendations.push('Your largest position represents over 50% of portfolio - consider rebalancing');
    }
    if (impermanentLossRisk > 20) {
      recommendations.push('High exposure to impermanent loss - consider stablecoin yield alternatives');
    }
    if (smartContractRisk > 20) {
      recommendations.push('Some protocols have lower audit scores - stick with audited protocols when possible');
    }
    if (liquidityRisk > 20) {
      recommendations.push('Some positions are in low-TVL protocols - higher exit risk');
    }
    if (recommendations.length === 0) {
      recommendations.push('Your portfolio has good risk metrics - maintain diversification');
    }
    
    // Factor breakdown
    const factors = [
      { category: 'Protocol Security', weight: 0.35, score: avgProtocolScore, contribution: avgProtocolScore * 0.35 },
      { category: 'Diversification', weight: 0.20, score: diversificationScore, contribution: diversificationScore * 0.20 },
      { category: 'Concentration', weight: 0.15, score: 100 - concentrationRisk, contribution: (100 - concentrationRisk) * 0.15 },
      { category: 'Smart Contract', weight: 0.15, score: 100 - smartContractRisk, contribution: (100 - smartContractRisk) * 0.15 },
      { category: 'Liquidity', weight: 0.15, score: 100 - liquidityRisk, contribution: (100 - liquidityRisk) * 0.15 },
    ];
    
    return {
      overallScore: Math.round(overallScore),
      riskLevel,
      factors,
      recommendations,
      protocolBreakdown: protocolRisks,
      diversificationScore,
      concentrationRisk: Math.round(concentrationRisk),
      smartContractRisk: Math.round(smartContractRisk),
      liquidityRisk: Math.round(liquidityRisk),
      impermanentLossRisk: Math.round(impermanentLossRisk),
    };
  }

  async getHistoricalRisk(address: string, days: number): Promise<any> {
    // Generate mock historical data
    const history: { date: string; score: number; riskLevel: string }[] = [];
    const now = Date.now();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const baseScore = 65 + Math.sin(i / 5) * 10;
      const variance = (Math.random() - 0.5) * 10;
      
      history.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(baseScore + variance),
        riskLevel: baseScore + variance >= 60 ? 'medium' : 'high',
      });
    }
    
    return {
      address,
      history,
      summary: {
        avgScore: Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length),
        trend: history[history.length - 1].score > history[0].score ? 'improving' : 'declining',
        volatility: Math.round(Math.abs(history[history.length - 1].score - history[0].score)),
      },
    };
  }

  async compareRisk(addresses: string[]): Promise<any> {
    const results = await Promise.all(
      addresses.map(async (address) => {
        const chains = ['ethereum', 'polygon', 'arbitrum'];
        const positions = this.generateMockPositions(address, chains);
        const result = this.calculateRiskScore(positions);
        return {
          address,
          ...result,
        };
      }),
    );
    
    // Find best and worst
    const sorted = [...results].sort((a, b) => b.overallScore - a.overallScore);
    
    return {
      comparison: results,
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      averageScore: Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length),
    };
  }
}

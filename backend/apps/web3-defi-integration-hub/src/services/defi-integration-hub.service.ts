import { Injectable } from '@nestjs/common';
import {
  PositionDto,
  PortfolioSummaryDto,
  ProtocolInteractionDto,
  RebalanceDto,
  YieldOpportunityDto,
  PositionHistoryDto,
  PortfolioHealthDto,
} from '../dto/defi-integration.dto';

// Supported DeFi protocols
const SUPPORTED_PROTOCOLS = [
  { name: 'Aave', category: 'lending', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'] },
  { name: 'Compound', category: 'lending', chains: ['ethereum', 'polygon', 'arbitrum'] },
  { name: 'Uniswap', category: 'dex', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'] },
  { name: 'Curve', category: 'dex', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'] },
  { name: 'SushiSwap', category: 'dex', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'] },
  { name: 'Lido', category: 'staking', chains: ['ethereum'] },
  { name: 'Yearn', category: 'yield', chains: ['ethereum', 'arbitrum', 'optimism'] },
  { name: 'GMX', category: 'derivatives', chains: ['arbitrum', 'avalanche'] },
  { name: 'Balancer', category: 'dex', chains: ['ethereum', 'polygon', 'arbitrum'] },
  { name: 'Morpho', category: 'lending', chains: ['ethereum', 'arbitrum', 'optimism'] },
  { name: 'Rocket Pool', category: 'staking', chains: ['ethereum'] },
  { name: 'Aerodrome', category: 'dex', chains: ['base'] },
  { name: 'Velodrome', category: 'dex', chains: ['optimism'] },
  { name: 'PancakeSwap', category: 'dex', chains: ['bsc'] },
  { name: 'QuickSwap', category: 'dex', chains: ['polygon'] },
  { name: 'Trader Joe', category: 'dex', chains: ['avalanche'] },
];

// Mock position data storage
const mockPositions = new Map<string, PositionDto[]>();
const mockHistory = new Map<string, PositionHistoryDto[]>();

@Injectable()
export class DefiIntegrationHubService {
  // Initialize with some mock data
  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Sample positions for demo
    const demoAddress = '0x1234567890abcdef1234567890abcdef12345678';
    mockPositions.set(demoAddress, [
      {
        address: demoAddress,
        protocol: 'Aave',
        chain: 'ethereum',
        positionType: 'lending',
        tokens: ['0x0000000000000000000000000000000000000000', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
        depositedAmount: '10.5',
        currentValue: 28500,
        apy: 4.2,
      },
      {
        address: demoAddress,
        protocol: 'Uniswap',
        chain: 'ethereum',
        positionType: 'liquidity',
        tokens: ['0x0000000000000000000000000000000000000000', '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'],
        depositedAmount: '2.5',
        currentValue: 15200,
        apy: 18.5,
      },
      {
        address: demoAddress,
        protocol: 'Lido',
        chain: 'ethereum',
        positionType: 'staking',
        tokens: ['0x0000000000000000000000000000000000000000'],
        depositedAmount: '5.0',
        currentValue: 13500,
        apy: 3.8,
      },
      {
        address: demoAddress,
        protocol: 'Yearn',
        chain: 'ethereum',
        positionType: 'yield',
        tokens: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
        depositedAmount: '10000',
        currentValue: 10500,
        apy: 5.2,
      },
      {
        address: demoAddress,
        protocol: 'Aave',
        chain: 'polygon',
        positionType: 'lending',
        tokens: ['0x0000000000000000000000000000000000000000', '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39'],
        depositedAmount: '1000',
        currentValue: 2200,
        apy: 6.5,
      },
      {
        address: demoAddress,
        protocol: 'QuickSwap',
        chain: 'polygon',
        positionType: 'liquidity',
        tokens: ['0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'],
        depositedAmount: '500',
        currentValue: 1800,
        apy: 12.3,
      },
    ]);
  }

  async getUnifiedPortfolio(address: string): Promise<any> {
    const positions = mockPositions.get(address) || [];
    const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    
    // Group by protocol
    const byProtocol: Record<string, number> = {};
    positions.forEach(p => {
      byProtocol[p.protocol] = (byProtocol[p.protocol] || 0) + (p.currentValue || 0);
    });

    // Group by chain
    const byChain: Record<string, number> = {};
    positions.forEach(p => {
      byChain[p.chain] = (byChain[p.chain] || 0) + (p.currentValue || 0);
    });

    return {
      address,
      totalValue,
      positions: positions,
      breakdown: {
        byProtocol,
        byChain,
      },
      timestamp: new Date(),
    };
  }

  async getAllPositions(address: string): Promise<PositionDto[]> {
    return mockPositions.get(address) || [];
  }

  async addPosition(dto: PositionDto): Promise<{ success: boolean; positionId: string }> {
    const positions = mockPositions.get(dto.address) || [];
    const positionId = `${dto.protocol}-${dto.chain}-${Date.now()}`;
    const newPosition = { ...dto, currentValue: dto.currentValue || 0 };
    positions.push(newPosition);
    mockPositions.set(dto.address, positions);
    return { success: true, positionId };
  }

  async getSupportedProtocols(): Promise<any[]> {
    return SUPPORTED_PROTOCOLS.map(p => ({
      name: p.name,
      category: p.category,
      chains: p.chains,
      features: this.getProtocolFeatures(p.name),
    }));
  }

  private getProtocolFeatures(protocol: string): string[] {
    const features: Record<string, string[]> = {
      'Aave': ['Lending', 'Borrowing', 'Collateral', 'Flash Loans'],
      'Compound': ['Lending', 'Borrowing', 'Governance'],
      'Uniswap': ['Swap', 'Liquidity', 'Range Orders'],
      'Curve': ['Stable Swap', 'Liquidity', 'Gauge'],
      'SushiSwap': ['Swap', 'Liquidity', 'Farm'],
      'Lido': ['Staking', 'Rewards'],
      'Yearn': ['Vaults', 'Strategies', 'Auto-compound'],
      'GMX': ['Perpetuals', 'Liquidity', 'GLP'],
      'Balancer': ['Liquidity', 'Weighted Pools', 'Boosted Pools'],
      'Morpho': ['Lending', 'Borrowing', 'Supervisors'],
    };
    return features[protocol] || [];
  }

  async getProtocolPositions(protocol: string, address: string): Promise<PositionDto[]> {
    const positions = mockPositions.get(address) || [];
    return positions.filter(p => p.protocol.toLowerCase() === protocol.toLowerCase());
  }

  async getPortfolioSummary(address: string): Promise<PortfolioSummaryDto> {
    const positions = mockPositions.get(address) || [];
    const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    
    // Calculate weighted APY
    const weightedApy = positions.reduce((sum, p) => {
      const weight = (p.currentValue || 0) / totalValue;
      return sum + (p.apy || 0) * weight;
    }, 0);

    // 24h change (mock)
    const change24h = (Math.random() - 0.5) * 10;

    // Risk score calculation
    const riskScore = this.calculateRiskScore(positions, totalValue);

    // Breakdown
    const positionsByProtocol: Record<string, number> = {};
    const positionsByChain: Record<string, number> = {};
    
    positions.forEach(p => {
      positionsByProtocol[p.protocol] = (positionsByProtocol[p.protocol] || 0) + (p.currentValue || 0);
      positionsByChain[p.chain] = (positionsByChain[p.chain] || 0) + (p.currentValue || 0);
    });

    return {
      address,
      totalValue,
      change24h,
      positionsByProtocol,
      positionsByChain,
      riskScore,
      weightedApy,
    };
  }

  private calculateRiskScore(positions: PositionDto[], totalValue: number): number {
    if (positions.length === 0) return 50;
    
    // Calculate concentration
    const values = positions.map(p => p.currentValue || 0);
    const maxConcentration = Math.max(...values) / totalValue;
    
    // Chain diversity
    const chains = new Set(positions.map(p => p.chain));
    const chainDiversity = Math.min(chains.size / 7, 1);
    
    // Protocol diversity
    const protocols = new Set(positions.map(p => p.protocol));
    const protocolDiversity = Math.min(protocols.size / 10, 1);
    
    // Base score with adjustments
    let score = 70;
    score -= (maxConcentration - 0.2) * 30; // Penalty for concentration
    score += chainDiversity * 15;
    score += protocolDiversity * 15;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async executeInteraction(dto: ProtocolInteractionDto): Promise<any> {
    // Simulate interaction execution
    const txHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    return {
      success: true,
      txHash,
      protocol: dto.protocol,
      chain: dto.chain,
      action: dto.action,
      estimatedGas: Math.floor(Math.random() * 100000) + 50000,
      timestamp: new Date(),
    };
  }

  async getRebalanceRecommendations(dto: RebalanceDto): Promise<any> {
    const positions = mockPositions.get(dto.address) || [];
    const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    
    const currentAllocation: Record<string, number> = {};
    positions.forEach(p => {
      currentAllocation[p.protocol] = (currentAllocation[p.protocol] || 0) + (p.currentValue || 0);
    });

    // Calculate recommended actions
    const actions = [];
    for (const [protocol, targetPct] of Object.entries(dto.targetAllocation)) {
      const currentPct = (currentAllocation[protocol] || 0) / totalValue * 100;
      const diff = targetPct - currentPct;
      
      if (Math.abs(diff) > 2) {
        actions.push({
          protocol,
          action: diff > 0 ? 'increase' : 'decrease',
          currentPercent: Math.round(currentPct),
          targetPercent: targetPct,
          amountUsd: Math.round((diff / 100) * totalValue),
          recommendation: diff > 0 
            ? `Increase ${protocol} exposure by ${Math.round(diff)}%`
            : `Decrease ${protocol} exposure by ${Math.round(-diff)}%`,
        });
      }
    }

    return {
      address: dto.address,
      totalValue,
      currentAllocation: Object.fromEntries(
        Object.entries(currentAllocation).map(([k, v]) => [k, Math.round(v)])
      ),
      targetAllocation: dto.targetAllocation,
      rebalanceActions: actions,
      estimatedGasCost: actions.length * 50,
      timestamp: new Date(),
    };
  }

  async getPositionHistory(address: string, protocol?: string): Promise<PositionHistoryDto[]> {
    let history = mockHistory.get(address) || [];
    
    if (protocol) {
      history = history.filter(h => h.protocol.toLowerCase() === protocol.toLowerCase());
    }
    
    // Generate mock history if empty
    if (history.length === 0) {
      history = this.generateMockHistory(address);
    }
    
    return history;
  }

  private generateMockHistory(address: string): PositionHistoryDto[] {
    const protocols = ['Aave', 'Uniswap', 'Lido', 'Yearn', 'Compound'];
    const chains = ['ethereum', 'polygon', 'arbitrum'];
    const actions = ['deposit', 'withdraw', 'swap', 'stake', 'claim'];
    
    const history: PositionHistoryDto[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 20; i++) {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      history.push({
        positionId: `pos-${i}`,
        protocol,
        chain,
        action,
        tokens: ['0x...'],
        amounts: [Math.random().toFixed(4)],
        usdValue: Math.random() * 10000,
        timestamp: new Date(now - i * 86400000),
        txHash: '0x' + Math.random().toString(16).slice(2, 66),
      });
    }
    
    mockHistory.set(address, history);
    return history;
  }

  async findYieldOpportunities(chain?: string, minTvL?: number): Promise<YieldOpportunityDto[]> {
    const opportunities: YieldOpportunityDto[] = [
      {
        protocol: 'Aave',
        chain: 'ethereum',
        poolId: 'aave-v3-eth',
        tokens: ['ETH', 'USDC'],
        apy: 4.2,
        tvl: 15000000000,
        riskLevel: 'low',
        volume24h: 250000000,
      },
      {
        protocol: 'Uniswap',
        chain: 'ethereum',
        poolId: 'uniswap-v3-eth-usdc',
        tokens: ['ETH', 'USDC'],
        apy: 18.5,
        tvl: 250000000,
        riskLevel: 'medium',
        volume24h: 180000000,
      },
      {
        protocol: 'Curve',
        chain: 'ethereum',
        poolId: 'crv-eth',
        tokens: ['CRV', 'ETH'],
        apy: 8.2,
        tvl: 800000000,
        riskLevel: 'low',
        volume24h: 45000000,
      },
      {
        protocol: 'Lido',
        chain: 'ethereum',
        poolId: 'steth',
        tokens: ['ETH', 'stETH'],
        apy: 3.8,
        tvl: 32000000000,
        riskLevel: 'low',
        volume24h: 15000000,
      },
      {
        protocol: 'GMX',
        chain: 'arbitrum',
        poolId: 'gmx-glp',
        tokens: ['GMX', 'GLP'],
        apy: 12.5,
        tvl: 450000000,
        riskLevel: 'medium',
        volume24h: 85000000,
      },
      {
        protocol: 'QuickSwap',
        chain: 'polygon',
        poolId: 'quick-matic-usdc',
        tokens: ['MATIC', 'USDC'],
        apy: 15.2,
        tvl: 85000000,
        riskLevel: 'medium',
        volume24h: 12000000,
      },
      {
        protocol: 'Aerodrome',
        chain: 'base',
        poolId: 'aero-eth-usdc',
        tokens: ['AERO', 'USDC'],
        apy: 22.5,
        tvl: 65000000,
        riskLevel: 'high',
        volume24h: 18000000,
      },
      {
        protocol: 'PancakeSwap',
        chain: 'bsc',
        poolId: 'cake-bnb-usdt',
        tokens: ['CAKE', 'BNB', 'USDT'],
        apy: 14.8,
        tvl: 180000000,
        riskLevel: 'medium',
        volume24h: 35000000,
      },
    ];

    let filtered = opportunities;
    
    if (chain) {
      filtered = filtered.filter(o => o.chain.toLowerCase() === chain.toLowerCase());
    }
    
    if (minTvL) {
      filtered = filtered.filter(o => o.tvl >= minTvL);
    }

    // Sort by APY
    return filtered.sort((a, b) => b.apy - a.apy);
  }

  async getPortfolioHealth(address: string): Promise<PortfolioHealthDto> {
    const positions = mockPositions.get(address) || [];
    const totalValue = positions.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    
    // Calculate various health metrics
    const healthScore = this.calculateRiskScore(positions, totalValue);
    const grade = this.scoreToGrade(healthScore);
    
    // Diversification score
    const uniqueProtocols = new Set(positions.map(p => p.protocol)).size;
    const uniqueChains = new Set(positions.map(p => p.chain)).size;
    const diversificationScore = Math.min(100, (uniqueProtocols * 10 + uniqueChains * 10));
    
    // Concentration risk
    const values = positions.map(p => p.currentValue || 0);
    const maxValue = Math.max(...values, 0);
    const concentrationRisk = totalValue > 0 ? Math.round((maxValue / totalValue) * 100) : 0;
    
    // Liquidity score (based on position types)
    const liquidityScores: Record<string, number> = {
      'lending': 90,
      'staking': 70,
      'liquidity': 50,
      'yield': 60,
      'derivatives': 40,
    };
    const avgLiquidity = positions.length > 0
      ? positions.reduce((sum, p) => sum + (liquidityScores[p.positionType] || 50), 0) / positions.length
      : 50;
    const liquidityScore = Math.round(avgLiquidity);
    
    // Risk factors
    const riskFactors: string[] = [];
    if (concentrationRisk > 50) riskFactors.push('High concentration in single position');
    if (uniqueChains < 3) riskFactors.push('Limited chain diversification');
    if (uniqueProtocols < 3) riskFactors.push('Limited protocol diversification');
    if (totalValue < 1000) riskFactors.push('Portfolio value too small for optimal DeFi');
    
    // Recommendations
    const recommendations: string[] = [];
    if (concentrationRisk > 50) recommendations.push('Consider diversifying across more positions');
    if (uniqueChains < 3) recommendations.push('Explore opportunities on other chains');
    if (uniqueProtocols < 3) recommendations.push('Try protocols in different categories');
    if (liquidityScore < 60) recommendations.push('Consider adding more liquid positions');

    return {
      address,
      healthScore,
      grade,
      diversificationScore,
      concentrationRisk,
      liquidityScore,
      riskFactors,
      recommendations,
    };
  }

  private scoreToGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

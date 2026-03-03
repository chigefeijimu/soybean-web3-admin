import { Injectable } from '@nestjs/common';

interface LiquidityPosition {
  id: string;
  protocol: string;
  chain: string;
  pool: string;
  token0: string;
  token1: string;
  tvl: number;
  volume24h: number;
  apr: number;
  feeTier: number;
  concentration: number;
}

interface RebalancePlan {
  id: string;
  name: string;
  description: string;
  totalValue: number;
  currentAllocation: Allocation[];
  recommendedAllocation: Allocation[];
  expectedImprovement: number;
  actions: RebalanceAction[];
  riskAssessment: RiskAssessment;
  createdAt: string;
}

interface Allocation {
  protocol: string;
  chain: string;
  pool: string;
  percentage: number;
  value: number;
  apr: number;
}

interface RebalanceAction {
  type: 'add' | 'remove' | 'transfer';
  fromProtocol?: string;
  fromChain?: string;
  toProtocol: string;
  toChain: string;
  pool: string;
  amount: number;
  estimatedGas: number;
  estimatedTime: number;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  impermanentLoss: number;
  gasCost: number;
  slippage: number;
  factors: string[];
}

interface RebalanceRequest {
  walletAddress: string;
  positions: PositionInput[];
  targetAllocation: TargetAllocation[];
  maxGasCost: number;
  preferChains: string[];
  preferProtocols: string[];
}

interface PositionInput {
  protocol: string;
  chain: string;
  pool: string;
  value: number;
  token0: string;
  token1: string;
}

interface TargetAllocation {
  protocol: string;
  chain: string;
  pool: string;
  targetPercentage: number;
}

@Injectable()
export class LiquidityRebalancerService {
  private readonly mockPositions: LiquidityPosition[] = [
    // Uniswap V3
    { id: '1', protocol: 'Uniswap V3', chain: 'ethereum', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 2500000000, volume24h: 180000000, apr: 12.5, feeTier: 3000, concentration: 0.6 },
    { id: '2', protocol: 'Uniswap V3', chain: 'arbitrum', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 450000000, volume24h: 35000000, apr: 15.2, feeTier: 3000, concentration: 0.5 },
    { id: '3', protocol: 'Uniswap V3', chain: 'optimism', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 280000000, volume24h: 22000000, apr: 14.8, feeTier: 3000, concentration: 0.55 },
    // SushiSwap
    { id: '4', protocol: 'SushiSwap', chain: 'ethereum', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 180000000, volume24h: 15000000, apr: 10.2, feeTier: 3000, concentration: 0.4 },
    { id: '5', protocol: 'SushiSwap', chain: 'polygon', pool: 'USDC/MATIC', token0: 'USDC', token1: 'MATIC', tvl: 120000000, volume24h: 8000000, apr: 18.5, feeTier: 3000, concentration: 0.45 },
    { id: '6', protocol: 'SushiSwap', chain: 'arbitrum', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 95000000, volume24h: 6500000, apr: 14.2, feeTier: 3000, concentration: 0.42 },
    // Curve
    { id: '7', protocol: 'Curve', chain: 'ethereum', pool: 'ETH/stETH', token0: 'ETH', token1: 'stETH', tvl: 1800000000, volume24h: 45000000, apr: 5.8, feeTier: 0, concentration: 0.85 },
    { id: '8', protocol: 'Curve', chain: 'ethereum', pool: 'USDC/USDT/DAI', token0: 'USDC', token1: 'USDT', tvl: 3500000000, volume24h: 280000000, apr: 3.2, feeTier: 0, concentration: 0.9 },
    // Balancer
    { id: '9', protocol: 'Balancer', chain: 'ethereum', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 450000000, volume24h: 28000000, apr: 11.5, feeTier: 3000, concentration: 0.5 },
    { id: '10', protocol: 'Balancer', chain: 'arbitrum', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 180000000, volume24h: 12000000, apr: 13.8, feeTier: 3000, concentration: 0.48 },
    // PancakeSwap
    { id: '11', protocol: 'PancakeSwap', chain: 'bsc', pool: 'USDT/BNB', token0: 'USDT', token1: 'BNB', tvl: 380000000, volume24h: 45000000, apr: 16.5, feeTier: 2500, concentration: 0.52 },
    { id: '12', protocol: 'PancakeSwap', chain: 'bsc', pool: 'USDC/CAKE', token0: 'USDC', token1: 'CAKE', tvl: 120000000, volume24h: 8000000, apr: 22.5, feeTier: 2500, concentration: 0.38 },
    // QuickSwap
    { id: '13', protocol: 'QuickSwap', chain: 'polygon', pool: 'USDC/MATIC', token0: 'USDC', token1: 'MATIC', tvl: 280000000, volume24h: 22000000, apr: 14.8, feeTier: 3000, concentration: 0.5 },
    // GMX
    { id: '14', protocol: 'GMX', chain: 'arbitrum', pool: 'ETH/USDC', token0: 'ETH', token1: 'USDC', tvl: 600000000, volume24h: 85000000, apr: 15.8, feeTier: 3000, concentration: 0.65 },
    { id: '15', protocol: 'GMX', chain: 'avalanche', pool: 'AVAX/USDC', token0: 'AVAX', token1: 'USDC', tvl: 280000000, volume24h: 32000000, apr: 14.2, feeTier: 3000, concentration: 0.58 },
    // Aerodrome
    { id: '16', protocol: 'Aerodrome', chain: 'base', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 400000000, volume24h: 48000000, apr: 16.2, feeTier: 3000, concentration: 0.55 },
    { id: '17', protocol: 'Aerodrome', chain: 'base', pool: 'USDC/ cbBTC', token0: 'USDC', token1: 'cbBTC', tvl: 180000000, volume24h: 15000000, apr: 18.5, feeTier: 3000, concentration: 0.42 },
    // Velodrome
    { id: '18', protocol: 'Velodrome', chain: 'optimism', pool: 'OP/ETH', token0: 'OP', token1: 'ETH', tvl: 300000000, volume24h: 28000000, apr: 18.5, feeTier: 3000, concentration: 0.48 },
    { id: '19', protocol: 'Velodrome', chain: 'optimism', pool: 'USDC/ETH', token0: 'USDC', token1: 'ETH', tvl: 220000000, volume24h: 18000000, apr: 13.2, feeTier: 3000, concentration: 0.52 },
    // Trader Joe
    { id: '20', protocol: 'Trader Joe', chain: 'avalanche', pool: 'AVAX/USDC', token0: 'AVAX', token1: 'USDC', tvl: 250000000, volume24h: 28000000, apr: 12.8, feeTier: 3000, concentration: 0.55 },
  ];

  async getPositions(chain?: string, protocol?: string): Promise<LiquidityPosition[]> {
    let positions = this.mockPositions;
    
    if (chain) {
      positions = positions.filter(p => p.chain === chain);
    }
    
    if (protocol) {
      positions = positions.filter(p => p.protocol === protocol);
    }
    
    return positions;
  }

  async getTopPools(limit: number = 10): Promise<LiquidityPosition[]> {
    return [...this.mockPositions]
      .sort((a, b) => b.apr - a.apr)
      .slice(0, limit);
  }

  async getPoolsByChain(chain: string): Promise<LiquidityPosition[]> {
    return this.mockPositions.filter(p => p.chain === chain);
  }

  async getPoolsByProtocol(protocol: string): Promise<LiquidityPosition[]> {
    return this.mockPositions.filter(p => p.protocol === protocol);
  }

  async analyzeRebalance(request: RebalanceRequest): Promise<RebalancePlan> {
    const { positions, targetAllocation, maxGasCost, preferChains, preferProtocols } = request;
    
    // Calculate current allocation
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    const currentAllocation: Allocation[] = positions.map(p => ({
      protocol: p.protocol,
      chain: p.chain,
      pool: p.pool,
      percentage: (p.value / totalValue) * 100,
      value: p.value,
      apr: this.getPoolApr(p.protocol, p.chain, p.pool),
    }));

    // Calculate recommended allocation based on APR optimization
    const recommendedAllocation = this.calculateOptimalAllocation(
      positions,
      targetAllocation,
      totalValue,
      preferChains,
      preferProtocols
    );

    // Calculate expected improvement
    const currentWeightedApr = this.calculateWeightedApr(currentAllocation);
    const newWeightedApr = this.calculateWeightedApr(recommendedAllocation);
    const expectedImprovement = ((newWeightedApr - currentWeightedApr) / currentWeightedApr) * 100;

    // Generate rebalance actions
    const actions = this.generateRebalanceActions(
      currentAllocation,
      recommendedAllocation,
      positions
    );

    // Risk assessment
    const riskAssessment = this.assessRisk(actions, positions, maxGasCost);

    return {
      id: `plan_${Date.now()}`,
      name: 'Liquidity Rebalance Plan',
      description: `Optimize liquidity allocation across ${positions.length} positions for better returns`,
      totalValue,
      currentAllocation,
      recommendedAllocation,
      expectedImprovement,
      actions,
      riskAssessment,
      createdAt: new Date().toISOString(),
    };
  }

  private getPoolApr(protocol: string, chain: string, pool: string): number {
    const position = this.mockPositions.find(
      p => p.protocol === protocol && p.chain === chain && p.pool === pool
    );
    return position?.apr || 10;
  }

  private calculateOptimalAllocation(
    positions: PositionInput[],
    targets: TargetAllocation[],
    totalValue: number,
    preferChains: string[],
    preferProtocols: string[]
  ): Allocation[] {
    // Get APR for each position
    const positionsWithApr = positions.map(p => ({
      ...p,
      apr: this.getPoolApr(p.protocol, p.chain, p.pool),
    }));

    // Sort by APR (descending) and apply preferences
    const sorted = positionsWithApr.sort((a, b) => {
      let aScore = a.apr;
      let bScore = b.apr;
      
      // Apply chain preference bonus
      if (preferChains.includes(a.chain)) aScore *= 1.1;
      if (preferChains.includes(b.chain)) bScore *= 1.1;
      
      // Apply protocol preference bonus
      if (preferProtocols.includes(a.protocol)) aScore *= 1.05;
      if (preferProtocols.includes(b.protocol)) bScore *= 1.05;
      
      return bScore - aScore;
    });

    // Generate recommendations
    const recommendations: Allocation[] = [];
    let remainingPercentage = 100;

    for (let i = 0; i < sorted.length && remainingPercentage > 0; i++) {
      const pos = sorted[i];
      // Higher APR pools get more allocation
      const percentage = Math.min(remainingPercentage, Math.max(5, 50 - i * 5));
      
      recommendations.push({
        protocol: pos.protocol,
        chain: pos.chain,
        pool: pos.pool,
        percentage,
        value: (totalValue * percentage) / 100,
        apr: pos.apr,
      });
      
      remainingPercentage -= percentage;
    }

    return recommendations;
  }

  private calculateWeightedApr(allocation: Allocation[]): number {
    const total = allocation.reduce((sum, a) => sum + a.percentage, 0);
    if (total === 0) return 0;
    
    return allocation.reduce((sum, a) => {
      return sum + (a.apr * (a.percentage / total));
    }, 0);
  }

  private generateRebalanceActions(
    current: Allocation[],
    recommended: Allocation[],
    positions: PositionInput[]
  ): RebalanceAction[] {
    const actions: RebalanceAction[] = [];
    
    const currentMap = new Map(current.map(c => [`${c.protocol}-${c.chain}-${c.pool}`, c]));
    const recommendedMap = new Map(recommended.map(r => [`${r.protocol}-${r.chain}-${r.pool}`, r]));

    // Find positions to remove/reduce
    for (const [key, curr] of currentMap) {
      const rec = recommendedMap.get(key);
      const diff = curr.percentage - (rec?.percentage || 0);
      
      if (diff > 2) {
        const gasEstimate = this.estimateGas(curr.chain);
        actions.push({
          type: 'remove',
          fromProtocol: curr.protocol,
          fromChain: curr.chain,
          toProtocol: '',
          toChain: '',
          pool: curr.pool,
          amount: (curr.value * diff) / 100,
          estimatedGas: gasEstimate,
          estimatedTime: this.estimateTime(curr.chain),
        });
      }
    }

    // Find positions to add/increase
    for (const [key, rec] of recommendedMap) {
      const curr = currentMap.get(key);
      const diff = rec.percentage - (curr?.percentage || 0);
      
      if (diff > 2) {
        const gasEstimate = this.estimateGas(rec.chain);
        actions.push({
          type: 'add',
          fromProtocol: '',
          fromChain: '',
          toProtocol: rec.protocol,
          toChain: rec.chain,
          pool: rec.pool,
          amount: (rec.value * diff) / 100,
          estimatedGas: gasEstimate,
          estimatedTime: this.estimateTime(rec.chain),
        });
      }
    }

    return actions;
  }

  private assessRisk(
    actions: RebalanceAction[],
    positions: PositionInput[],
    maxGasCost: number
  ): RiskAssessment {
    let totalGasCost = actions.reduce((sum, a) => sum + a.estimatedGas, 0);
    let avgConcentration = positions.length > 0 
      ? positions.length / 20 
      : 0.5;
    
    // Impermanent loss estimation (simplified)
    const impermanentLoss = actions.filter(a => a.type === 'add').length * 2.5;
    
    // Slippage estimation
    const slippage = actions.length * 0.3;
    
    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (totalGasCost > maxGasCost || impermanentLoss > 10 || slippage > 3) {
      overallRisk = 'high';
    } else if (totalGasCost > maxGasCost * 0.5 || impermanentLoss > 5 || slippage > 1.5) {
      overallRisk = 'medium';
    }

    const factors = [
      impermanentLoss > 5 ? 'High impermanent loss risk' : 'Low impermanent loss risk',
      totalGasCost > maxGasCost ? 'Gas costs exceed limit' : 'Gas costs within limit',
      slippage > 2 ? 'High slippage expected' : 'Low slippage expected',
      avgConcentration > 0.7 ? 'High concentration risk' : 'Well diversified',
    ];

    return {
      overallRisk,
      impermanentLoss,
      gasCost: totalGasCost,
      slippage,
      factors,
    };
  }

  private estimateGas(chain: string): number {
    const gasEstimates: Record<string, number> = {
      ethereum: 85,
      arbitrum: 2,
      optimism: 2,
      polygon: 3,
      avalanche: 4,
      base: 2,
      bsc: 5,
    };
    return gasEstimates[chain] || 10;
  }

  private estimateTime(chain: string): number {
    const timeEstimates: Record<string, number> = {
      ethereum: 300,
      arbitrum: 15,
      optimism: 15,
      polygon: 30,
      avalanche: 30,
      base: 15,
      bsc: 30,
    };
    return timeEstimates[chain] || 60;
  }

  async getChainStats(): Promise<any> {
    const chains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'base', 'bsc'];
    
    return chains.map(chain => {
      const chainPositions = this.mockPositions.filter(p => p.chain === chain);
      const totalTvl = chainPositions.reduce((sum, p) => sum + p.tvl, 0);
      const avgApr = chainPositions.length > 0
        ? chainPositions.reduce((sum, p) => sum + p.apr, 0) / chainPositions.length
        : 0;
      const totalVolume = chainPositions.reduce((sum, p) => sum + p.volume24h, 0);
      
      return {
        chain,
        totalTvl,
        avgApr,
        totalVolume24h: totalVolume,
        poolCount: chainPositions.length,
      };
    });
  }

  async getProtocolStats(): Promise<any> {
    const protocols = ['Uniswap V3', 'SushiSwap', 'Curve', 'Balancer', 'PancakeSwap', 'QuickSwap', 'GMX', 'Aerodrome', 'Velodrome', 'Trader Joe'];
    
    return protocols.map(protocol => {
      const protocolPositions = this.mockPositions.filter(p => p.protocol === protocol);
      const totalTvl = protocolPositions.reduce((sum, p) => sum + p.tvl, 0);
      const avgApr = protocolPositions.length > 0
        ? protocolPositions.reduce((sum, p) => sum + p.apr, 0) / protocolPositions.length
        : 0;
      
      return {
        protocol,
        totalTvl,
        avgApr,
        poolCount: protocolPositions.length,
        chains: [...new Set(protocolPositions.map(p => p.chain))],
      };
    });
  }
}

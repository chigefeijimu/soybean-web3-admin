import { Injectable } from '@nestjs/common';

export interface DefiPosition {
  id: string;
  protocol: string;
  protocolLogo: string;
  chain: string;
  type: 'lending' | 'liquidity' | 'staking' | 'farming' | 'borrow' | 'vesting';
  token0?: string;
  token1?: string;
  token0Amount: string;
  token1Amount?: string;
  usdValue: number;
  apy: number;
  rewards?: Array<{ token: string; amount: string; usdValue: number }>;
  healthFactor?: number;
  liquidationPrice?: number;
  lastUpdated: string;
}

export interface AggregatedPositions {
  address: string;
  totalValue: number;
  totalApy: number;
  positions: DefiPosition[];
  chainDistribution: Record<string, number>;
  protocolDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  summary: {
    lending: number;
    liquidity: number;
    staking: number;
    farming: number;
    borrow: number;
    vesting: number;
  };
}

@Injectable()
export class DefiPositionAggregatorService {
  private readonly supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'base',
    'avalanche',
  ];

  private readonly supportedProtocols = {
    lending: ['Aave V3', 'Compound V3', 'Morpho', 'Liquity', 'Gearbox', 'Radiant'],
    liquidity: ['Uniswap V3', 'Uniswap V2', 'SushiSwap', 'Curve', 'Balancer', 'PancakeSwap'],
    staking: ['Lido', 'Rocket Pool', 'Frax', 'Stakewise', 'Ankr', 'Staked'],
    farming: ['Yearn', 'Convex', 'Gauge', 'MasterChef', 'MiniChef'],
    vesting: ['Vesting', 'TokenDistributor'],
  };

  async getPositions(address: string, chains?: string[]): Promise<AggregatedPositions> {
    const targetChains = chains?.length ? chains : this.supportedChains;
    
    // Simulate aggregating positions from multiple protocols
    const positions = await this.aggregatePositions(address, targetChains);
    
    return this.calculateAggregations(address, positions);
  }

  private async aggregatePositions(address: string, chains: string[]): Promise<DefiPosition[]> {
    const positions: DefiPosition[] = [];

    for (const chain of chains) {
      // Aggregate lending positions
      const lendingPositions = this.generateLendingPositions(address, chain);
      positions.push(...lendingPositions);

      // Aggregate liquidity positions
      const liquidityPositions = this.generateLiquidityPositions(address, chain);
      positions.push(...liquidityPositions);

      // Aggregate staking positions
      const stakingPositions = this.generateStakingPositions(address, chain);
      positions.push(...stakingPositions);

      // Aggregate farming positions
      const farmingPositions = this.generateFarmingPositions(address, chain);
      positions.push(...farmingPositions);
    }

    return positions;
  }

  private generateLendingPositions(address: string, chain: string): DefiPosition[] {
    const protocols = this.supportedProtocols.lending;
    const tokens = this.getChainTokens(chain);
    
    return protocols.slice(0, 2).map((protocol, idx) => ({
      id: `${address}-${chain}-lending-${idx}`,
      protocol,
      protocolLogo: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${tokens[idx % tokens.length].toLowerCase()}.png`,
      chain,
      type: 'lending' as const,
      token0: tokens[idx % tokens.length],
      token0Amount: (Math.random() * 10000).toFixed(2),
      usdValue: Math.random() * 50000,
      apy: Math.random() * 8 + 2,
      healthFactor: Math.random() * 2 + 1,
      lastUpdated: new Date().toISOString(),
    }));
  }

  private generateLiquidityPositions(address: string, chain: string): DefiPosition[] {
    const protocols = this.supportedProtocols.liquidity;
    const tokens = this.getChainTokens(chain);
    
    return protocols.slice(0, 2).map((protocol, idx) => ({
      id: `${address}-${chain}-liquidity-${idx}`,
      protocol,
      protocolLogo: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${tokens[idx % tokens.length].toLowerCase()}.png`,
      chain,
      type: 'liquidity' as const,
      token0: tokens[idx % tokens.length],
      token1: tokens[(idx + 1) % tokens.length],
      token0Amount: (Math.random() * 5000).toFixed(2),
      token1Amount: (Math.random() * 5000).toFixed(2),
      usdValue: Math.random() * 30000,
      apy: Math.random() * 25 + 5,
      rewards: [
        {
          token: 'CRV',
          amount: (Math.random() * 100).toFixed(2),
          usdValue: Math.random() * 50,
        },
      ],
      lastUpdated: new Date().toISOString(),
    }));
  }

  private generateStakingPositions(address: string, chain: string): DefiPosition[] {
    const protocols = this.supportedProtocols.staking;
    const stakeTokens = chain === 'ethereum' ? ['ETH', 'stETH', 'rETH'] : ['MATIC', 'AVAX', 'BNB'];
    
    return protocols.slice(0, 1).map((protocol, idx) => ({
      id: `${address}-${chain}-staking-${idx}`,
      protocol,
      protocolLogo: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${stakeTokens[idx].toLowerCase()}.png`,
      chain,
      type: 'staking' as const,
      token0: stakeTokens[idx],
      token0Amount: (Math.random() * 50).toFixed(4),
      usdValue: Math.random() * 100000,
      apy: Math.random() * 10 + 3,
      rewards: [
        {
          token: stakeTokens[idx],
          amount: (Math.random() * 2).toFixed(4),
          usdValue: Math.random() * 4000,
        },
      ],
      lastUpdated: new Date().toISOString(),
    }));
  }

  private generateFarmingPositions(address: string, chain: string): DefiPosition[] {
    const protocols = this.supportedProtocols.farming;
    const tokens = this.getChainTokens(chain);
    
    return protocols.slice(0, 1).map((protocol, idx) => ({
      id: `${address}-${chain}-farming-${idx}`,
      protocol,
      protocolLogo: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${tokens[idx % tokens.length].toLowerCase()}.png`,
      chain,
      type: 'farming' as const,
      token0: tokens[idx % tokens.length],
      token1: tokens[(idx + 1) % tokens.length],
      token0Amount: (Math.random() * 3000).toFixed(2),
      token1Amount: (Math.random() * 3000).toFixed(2),
      usdValue: Math.random() * 20000,
      apy: Math.random() * 40 + 10,
      rewards: [
        {
          token: tokens[idx % tokens.length],
          amount: (Math.random() * 50).toFixed(2),
          usdValue: Math.random() * 100,
        },
        {
          token: 'CRV',
          amount: (Math.random() * 20).toFixed(2),
          usdValue: Math.random() * 10,
        },
      ],
      lastUpdated: new Date().toISOString(),
    }));
  }

  private getChainTokens(chain: string): string[] {
    const tokensByChain: Record<string, string[]> = {
      ethereum: ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI', 'AAVE'],
      polygon: ['MATIC', 'USDC', 'USDT', 'WMATIC', 'QUICK', 'GHST'],
      arbitrum: ['ETH', 'ARB', 'USDC', 'USDT', 'GMX', 'MAGIC'],
      optimism: ['ETH', 'OP', 'USDC', 'USDT', 'VELO', 'KROM'],
      bsc: ['BNB', 'CAKE', 'USDT', 'BUSD', 'CAKE', 'BANANA'],
      base: ['ETH', 'USDC', 'CBETH', 'DEGEN', 'BASIS'],
      avalanche: ['AVAX', 'JOE', 'USDC', 'USDT', 'PNG', 'QI'],
    };
    return tokensByChain[chain] || ['ETH', 'USDC'];
  }

  private calculateAggregations(address: string, positions: DefiPosition[]): AggregatedPositions {
    const chainDistribution: Record<string, number> = {};
    const protocolDistribution: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};
    
    let totalValue = 0;
    let weightedApySum = 0;

    for (const pos of positions) {
      totalValue += pos.usdValue;
      weightedApySum += pos.usdValue * pos.apy;

      chainDistribution[pos.chain] = (chainDistribution[pos.chain] || 0) + pos.usdValue;
      protocolDistribution[pos.protocol] = (protocolDistribution[pos.protocol] || 0) + pos.usdValue;
      typeDistribution[pos.type] = (typeDistribution[pos.type] || 0) + pos.usdValue;
    }

    const totalApy = totalValue > 0 ? weightedApySum / totalValue : 0;

    return {
      address,
      totalValue,
      totalApy,
      positions,
      chainDistribution,
      protocolDistribution,
      typeDistribution,
      summary: {
        lending: typeDistribution['lending'] || 0,
        liquidity: typeDistribution['liquidity'] || 0,
        staking: typeDistribution['staking'] || 0,
        farming: typeDistribution['farming'] || 0,
        borrow: typeDistribution['borrow'] || 0,
        vesting: typeDistribution['vesting'] || 0,
      },
    };
  }

  async getSupportedChains(): Promise<string[]> {
    return this.supportedChains;
  }

  async getSupportedProtocols(): Promise<Record<string, string[]>> {
    return this.supportedProtocols;
  }

  async comparePositions(addresses: string[], chains?: string[]): Promise<{
    addresses: string[];
    totalValues: number[];
    comparisons: Array<{
      address: string;
      totalValue: number;
      positionCount: number;
      chains: string[];
      protocols: string[];
    }>;
  }> {
    const results = await Promise.all(
      addresses.map(addr => this.getPositions(addr, chains))
    );

    return {
      addresses,
      totalValues: results.map(r => r.totalValue),
      comparisons: results.map(r => ({
        address: r.address,
        totalValue: r.totalValue,
        positionCount: r.positions.length,
        chains: [...new Set(r.positions.map(p => p.chain))],
        protocols: [...new Set(r.positions.map(p => p.protocol))],
      })),
    };
  }

  async getTopPositions(limit = 10, chain?: string): Promise<DefiPosition[]> {
    const allPositions: DefiPosition[] = [];
    
    for (const c of this.supportedChains) {
      if (chain && chain !== c) continue;
      
      const positions = await this.aggregatePositions('0x0000000000000000000000000000000000000000', [c]);
      allPositions.push(...positions);
    }

    return allPositions
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, limit);
  }

  async getPositionHealth(positions: DefiPosition[]): Promise<{
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{ name: string; value: number; weight: number; score: number }>;
    recommendations: string[];
  }> {
    const factors = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Calculate diversification score
    const uniqueChains = new Set(positions.map(p => p.chain)).size;
    const uniqueProtocols = new Set(positions.map(p => p.protocol)).size;
    const diversificationScore = Math.min(100, (uniqueChains * 15 + uniqueProtocols * 10));
    factors.push({ name: 'Diversification', value: uniqueChains + uniqueProtocols, weight: 0.3, score: diversificationScore });
    totalWeightedScore += diversificationScore * 0.3;
    totalWeight += 0.3;

    // Calculate health factor score for lending positions
    const lendingPositions = positions.filter(p => p.type === 'lending' && p.healthFactor);
    if (lendingPositions.length > 0) {
      const avgHealthFactor = lendingPositions.reduce((sum, p) => sum + (p.healthFactor || 0), 0) / lendingPositions.length;
      const healthScore = Math.min(100, avgHealthFactor * 50);
      factors.push({ name: 'Health Factor', value: avgHealthFactor, weight: 0.25, score: healthScore });
      totalWeightedScore += healthScore * 0.25;
      totalWeight += 0.25;
    }

    // Calculate APY score
    const avgApy = positions.length > 0 
      ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length 
      : 0;
    const apyScore = Math.min(100, avgApy * 5);
    factors.push({ name: 'Yield', value: avgApy, weight: 0.25, score: apyScore });
    totalWeightedScore += apyScore * 0.25;
    totalWeight += 0.25;

    // Calculate rewards score
    const totalRewards = positions.reduce((sum, p) => 
      sum + (p.rewards?.reduce((s, r) => s + r.usdValue, 0) || 0), 0);
    const rewardsScore = Math.min(100, totalRewards / 100);
    factors.push({ name: 'Rewards', value: totalRewards, weight: 0.2, score: rewardsScore });
    totalWeightedScore += rewardsScore * 0.2;
    totalWeight += 0.2;

    const finalScore = Math.round(totalWeightedScore / totalWeight);
    
    let level: 'excellent' | 'good' | 'fair' | 'poor';
    if (finalScore >= 80) level = 'excellent';
    else if (finalScore >= 60) level = 'good';
    else if (finalScore >= 40) level = 'fair';
    else level = 'poor';

    const recommendations = [];
    if (uniqueChains < 3) recommendations.push('Consider diversifying across more chains to reduce risk');
    if (uniqueProtocols < 3) recommendations.push('Explore different protocols to optimize yields');
    if (avgApy < 5) recommendations.push('Look for higher-yield opportunities in farming or lending');
    if (lendingPositions.length > 0 && avgApy < 1.5) recommendations.push('Consider adjusting lending positions for better rates');

    return { score: finalScore, level, factors, recommendations };
  }
}

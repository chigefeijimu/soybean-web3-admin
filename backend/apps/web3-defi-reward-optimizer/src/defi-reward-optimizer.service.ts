import { Injectable } from '@nestjs/common';

export interface RewardPool {
  protocol: string;
  chain: string;
  chainId: number;
  token: string;
  tokenAddress: string;
  apy: number;
  tvl: number;
  rewardToken: string;
  lockPeriod?: number;
  riskLevel: 'low' | 'medium' | 'high';
  minDeposit: number;
  url: string;
}

export interface RewardOptimizationInput {
  principal: number;
  token: string;
  durationDays: number;
  chains?: string[];
  protocols?: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface RewardCalculation {
  pool: RewardPool;
  projectedReward: number;
  roi: number;
  effectiveApy: number;
  riskScore: number;
}

export interface OptimizationResult {
  bestPools: RewardCalculation[];
  totalProjectedReward: number;
  diversificationScore: number;
  riskAssessment: string;
  recommendations: string[];
}

@Injectable()
export class DefiRewardOptimizerService {
  // Simulated reward pools data
  private rewardPools: RewardPool[] = [
    // Ethereum
    { protocol: 'Lido', chain: 'Ethereum', chainId: 1, token: 'stETH', tokenAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', apy: 3.2, tvl: 42000000000, rewardToken: 'LDO', lockPeriod: 0, riskLevel: 'low', minDeposit: 0.001, url: 'https://lido.fi' },
    { protocol: 'Rocket Pool', chain: 'Ethereum', chainId: 1, token: 'rETH', tokenAddress: '0xae78736Cd615f374D3085123A210448E74Fc6393', apy: 3.8, tvl: 2800000000, rewardToken: 'RPL', lockPeriod: 0, riskLevel: 'low', minDeposit: 0.01, url: 'https://rocketpool.net' },
    { protocol: 'Aave', chain: 'Ethereum', chainId: 1, token: 'USDC', tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', apy: 4.5, tvl: 15000000000, rewardToken: 'AAVE', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://aave.com' },
    { protocol: 'Compound', chain: 'Ethereum', chainId: 1, token: 'USDC', tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', apy: 4.1, tvl: 9000000000, rewardToken: 'COMP', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://compound.finance' },
    { protocol: 'Yearn', chain: 'Ethereum', chainId: 1, token: 'USDC', tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', apy: 5.2, tvl: 5000000000, rewardToken: 'YFI', lockPeriod: 0, riskLevel: 'medium', minDeposit: 100, url: 'https://yearn.finance' },
    { protocol: 'Curve', chain: 'Ethereum', chainId: 1, token: '3CRV', tokenAddress: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490', apy: 2.8, tvl: 2200000000, rewardToken: 'CRV', lockPeriod: 0, riskLevel: 'low', minDeposit: 100, url: 'https://curve.fi' },
    { protocol: 'Uniswap V3', chain: 'Ethereum', chainId: 1, token: 'ETH-USDC', tokenAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8', apy: 8.5, tvl: 1800000000, rewardToken: 'UNI', lockPeriod: 0, riskLevel: 'medium', minDeposit: 1000, url: 'https://uniswap.org' },
    
    // Polygon
    { protocol: 'Aave', chain: 'Polygon', chainId: 137, token: 'USDC', tokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', apy: 5.8, tvl: 800000000, rewardToken: 'AAVE', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://aave.com' },
    { protocol: 'Curve', chain: 'Polygon', chainId: 137, token: 'am3CRV', tokenAddress: '0xE7a24EF0C5e4779a49186C583aFe0571ee032859', apy: 4.2, tvl: 450000000, rewardToken: 'CRV', lockPeriod: 0, riskLevel: 'low', minDeposit: 100, url: 'https://curve.fi' },
    { protocol: 'QuickSwap', chain: 'Polygon', chainId: 137, token: 'QUICK-USDC', tokenAddress: '0x1F573D6Fb3F8d2A855EA64F0CB3B4a9537f2A16', apy: 12.5, tvl: 380000000, rewardToken: 'QUICK', lockPeriod: 0, riskLevel: 'medium', minDeposit: 50, url: 'https://quickswap.exchange' },
    
    // Arbitrum
    { protocol: 'Aave', chain: 'Arbitrum', chainId: 42161, token: 'USDC', tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', apy: 5.2, tvl: 1200000000, rewardToken: 'AAVE', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://aave.com' },
    { protocol: 'GMX', chain: 'Arbitrum', chainId: 42161, token: 'GMX', tokenAddress: '0xfc5A1A6EB076a2C7ad06e22EA90e0807a32AeEDa', apy: 15.0, tvl: 800000000, rewardToken: 'GMX', lockPeriod: 0, riskLevel: 'medium', minDeposit: 500, url: 'https://gmx.io' },
    { protocol: 'Curve', chain: 'Arbitrum', chainId: 42161, token: '2CRV', tokenAddress: '0xC9B8a2B1372E14a697fB89aEfFe6Be7c70A0A34D', apy: 3.5, tvl: 320000000, rewardToken: 'CRV', lockPeriod: 0, riskLevel: 'low', minDeposit: 100, url: 'https://curve.fi' },
    
    // Optimism
    { protocol: 'Aave', chain: 'Optimism', chainId: 10, token: 'USDC', tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d997Ff9e', apy: 4.8, tvl: 950000000, rewardToken: 'AAVE', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://aave.com' },
    { protocol: 'Velodrome', chain: 'Optimism', chainId: 10, token: 'VELO-USDC', tokenAddress: '0x89C451A95e28A53A7dEeEF05C8d6E2B2E5F8E5e', apy: 18.5, tvl: 280000000, rewardToken: 'VELO', lockPeriod: 0, riskLevel: 'high', minDeposit: 100, url: 'https://velodrome.finance' },
    { protocol: 'Curve', chain: 'Optimism', chainId: 10, token: '2CRV', tokenAddress: '0x1337BedC9D45EC50dE4B6bE8fD8F2d2b6d4a5c8', apy: 3.2, tvl: 180000000, rewardToken: 'CRV', lockPeriod: 0, riskLevel: 'low', minDeposit: 100, url: 'https://curve.fi' },
    
    // Avalanche
    { protocol: 'Aave', chain: 'Avalanche', chainId: 43114, token: 'USDC', tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', apy: 6.2, tvl: 650000000, rewardToken: 'AAVE', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://aave.com' },
    { protocol: 'Trader Joe', chain: 'Avalanche', chainId: 43114, token: 'JOE-USDC', tokenAddress: '0x188B1B8eD4F4Eb4AC77A9B5e6D4f6e3d8c9F2aE1', apy: 14.5, tvl: 420000000, rewardToken: 'JOE', lockPeriod: 0, riskLevel: 'medium', minDeposit: 50, url: 'https://traderjoe.xyz' },
    { protocol: 'Curve', chain: 'Avalanche', chainId: 43114, token: 'av3CRV', tokenAddress: '0x1daB6560494B7a1E5e4c1Af7D5eF3a7D8E9F2B3', apy: 4.8, tvl: 180000000, rewardToken: 'CRV', lockPeriod: 0, riskLevel: 'low', minDeposit: 100, url: 'https://curve.fi' },
    
    // BSC
    { protocol: 'PancakeSwap', chain: 'BSC', chainId: 56, token: 'CAKE-USDC', tokenAddress: '0xD4E7a6c2dE4dEc5d6C9F1d6e5f2d3C4a5b6E7F8', apy: 22.5, tvl: 680000000, rewardToken: 'CAKE', lockPeriod: 0, riskLevel: 'high', minDeposit: 10, url: 'https://pancakeswap.finance' },
    { protocol: 'Venus', chain: 'BSC', chainId: 56, token: 'USDC', tokenAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', apy: 4.2, tvl: 520000000, rewardToken: 'XVS', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://venus.io' },
    { protocol: 'Curve', chain: 'BSC', chainId: 56, token: 'busd3CRV', tokenAddress: '0x5B6B6f43D5d8b1C7F8C1E2D4A5B6C7D8E9F0A1B', apy: 5.8, tvl: 280000000, rewardToken: 'CRV', lockPeriod: 0, riskLevel: 'low', minDeposit: 100, url: 'https://curve.fi' },
    
    // Base
    { protocol: 'Aave', chain: 'Base', chainId: 8453, token: 'USDC', tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', apy: 5.5, tvl: 380000000, rewardToken: 'AAVE', lockPeriod: 0, riskLevel: 'low', minDeposit: 10, url: 'https://aave.com' },
    { protocol: 'Aerodrome', chain: 'Base', chainId: 8453, token: 'AERO-USDC', tokenAddress: '0x2d3B10C6C82d8C8B1E6F1d2A4E5F6A7B8C9D0E1', apy: 16.8, tvl: 320000000, rewardToken: 'AERO', lockPeriod: 0, riskLevel: 'medium', minDeposit: 50, url: 'https://aerodrome.finance' },
    { protocol: 'Curve', chain: 'Base', chainId: 8453, token: 'base3CRV', tokenAddress: '0x3d4B6C7B8e9F0A1B2C3D4E5F6A7B8C9D0E1F2A', apy: 4.5, tvl: 150000000, rewardToken: 'CRV', lockPeriod: 0, riskLevel: 'low', minDeposit: 100, url: 'https://curve.fi' },
  ];

  /**
   * Get all reward pools with optional filtering
   */
  getPools(chains?: string[], protocols?: string[]): RewardPool[] {
    let pools = [...this.rewardPools];
    
    if (chains && chains.length > 0) {
      pools = pools.filter(p => 
        chains.some(c => c.toLowerCase() === p.chain.toLowerCase())
      );
    }
    
    if (protocols && protocols.length > 0) {
      pools = pools.filter(p => 
        protocols.some(pr => pr.toLowerCase() === p.protocol.toLowerCase())
      );
    }
    
    return pools.sort((a, b) => b.apy - a.apy);
  }

  /**
   * Get pools by token
   */
  getPoolsByToken(token: string): RewardPool[] {
    return this.rewardPools
      .filter(p => p.token.toLowerCase().includes(token.toLowerCase()))
      .sort((a, b) => b.apy - a.apy);
  }

  /**
   * Get top pools by APY
   */
  getTopPools(limit: number = 10): RewardPool[] {
    return [...this.rewardPools]
      .sort((a, b) => b.apy - a.apy)
      .slice(0, limit);
  }

  /**
   * Get pools by chain
   */
  getPoolsByChain(chainId: number): RewardPool[] {
    return this.rewardPools
      .filter(p => p.chainId === chainId)
      .sort((a, b) => b.apy - a.apy);
  }

  /**
   * Calculate projected rewards for a pool
   */
  calculateReward(pool: RewardPool, principal: number, durationDays: number): RewardCalculation {
    // Compound interest calculation: A = P(1 + r/n)^(nt)
    // Assuming daily compounding for DeFi
    const n = 365; // compounding frequency
    const t = durationDays / 365;
    const r = pool.apy / 100;
    
    const projectedValue = principal * Math.pow(1 + r / n, n * t);
    const projectedReward = projectedValue - principal;
    const roi = (projectedReward / principal) * 100;
    
    // Effective APY adjusted for lock period if applicable
    let effectiveApy = pool.apy;
    if (pool.lockPeriod && pool.lockPeriod > 0) {
      // Apply lock period bonus
      effectiveApy = pool.apy * 1.1;
    }
    
    // Risk score calculation (0-100)
    const riskScore = this.calculateRiskScore(pool);
    
    return {
      pool,
      projectedReward,
      roi,
      effectiveApy,
      riskScore
    };
  }

  /**
   * Calculate risk score for a pool
   */
  private calculateRiskScore(pool: RewardPool): number {
    let score = 50; // base score
    
    // Risk level adjustment
    switch (pool.riskLevel) {
      case 'low':
        score -= 30;
        break;
      case 'medium':
        score += 10;
        break;
      case 'high':
        score += 30;
        break;
    }
    
    // TVL adjustment (higher TVL = lower risk)
    if (pool.tvl > 1000000000) score -= 15;
    else if (pool.tvl > 500000000) score -= 10;
    else if (pool.tvl > 100000000) score -= 5;
    
    // Protocol age/track record (simulated)
    const establishedProtocols = ['Aave', 'Compound', 'Lido', 'Curve', 'Yearn'];
    if (establishedProtocols.includes(pool.protocol)) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Optimize rewards based on input parameters
   */
  optimizeRewards(input: RewardOptimizationInput): OptimizationResult {
    let pools = this.getPools(input.chains, input.protocols);
    
    // Filter by risk tolerance
    pools = pools.filter(p => {
      if (input.riskTolerance === 'low') return p.riskLevel === 'low';
      if (input.riskTolerance === 'medium') return p.riskLevel !== 'high';
      return true;
    });
    
    // Calculate rewards for each pool
    const calculations: RewardCalculation[] = pools.map(pool => 
      this.calculateReward(pool, input.principal, input.durationDays)
    );
    
    // Sort by projected reward
    const sortedByReward = calculations.sort((a, b) => 
      b.projectedReward - a.projectedReward
    );
    
    // Get top 5 pools
    const bestPools = sortedByReward.slice(0, 5);
    
    // Calculate diversification score
    const diversificationScore = this.calculateDiversificationScore(bestPools);
    
    // Total projected reward (assuming allocation to top pool)
    const totalProjectedReward = bestPools[0]?.projectedReward || 0;
    
    // Risk assessment
    const avgRiskScore = bestPools.reduce((sum, c) => sum + c.riskScore, 0) / bestPools.length;
    let riskAssessment: string;
    if (avgRiskScore < 30) riskAssessment = 'Low Risk';
    else if (avgRiskScore < 50) riskAssessment = 'Moderate Risk';
    else riskAssessment = 'High Risk';
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(bestPools, input);
    
    return {
      bestPools,
      totalProjectedReward,
      diversificationScore,
      riskAssessment,
      recommendations
    };
  }

  /**
   * Calculate diversification score
   */
  private calculateDiversificationScore(calculations: RewardCalculation[]): number {
    if (calculations.length === 0) return 0;
    
    // Check if pools are across different chains
    const chains = new Set(calculations.map(c => c.pool.chain));
    const protocols = new Set(calculations.map(c => c.pool.protocol));
    
    let score = 30; // base score
    
    // Chain diversification bonus
    score += Math.min(chains.size * 10, 30);
    
    // Protocol diversification bonus
    score += Math.min(protocols.size * 8, 40);
    
    return Math.min(100, score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    bestPools: RewardCalculation[], 
    input: RewardOptimizationInput
  ): string[] {
    const recommendations: string[] = [];
    
    if (bestPools.length > 0) {
      const top = bestPools[0];
      recommendations.push(
        `Top pick: ${top.pool.protocol} on ${top.pool.chain} with ${top.pool.apy}% APY`
      );
    }
    
    // Suggest diversification if score is low
    if (bestPools.length > 1) {
      const chains = new Set(bestPools.map(c => c.pool.chain));
      if (chains.size < 2) {
        recommendations.push(
          'Consider diversifying across chains to reduce risk'
        );
      }
    }
    
    // Risk warnings
    const highRiskPools = bestPools.filter(c => c.pool.riskLevel === 'high');
    if (highRiskPools.length > 0) {
      recommendations.push(
        'Warning: Some selected pools have high risk. Consider reducing allocation to high-risk protocols.'
      );
    }
    
    // Gas optimization
    if (input.principal < 1000) {
      recommendations.push(
        'Consider consolidating funds to reduce cross-chain transaction costs'
      );
    }
    
    // Lock period suggestions
    const flexiblePools = bestPools.filter(c => !c.pool.lockPeriod || c.pool.lockPeriod === 0);
    if (flexiblePools.length > 0) {
      recommendations.push(
        'Flexible pools selected for liquidity. Consider lock periods for higher yields.'
      );
    }
    
    return recommendations;
  }

  /**
   * Compare rewards across all chains for a specific token
   */
  compareChains(token: string, principal: number, durationDays: number): any[] {
    const pools = this.getPoolsByToken(token);
    const chains = [...new Set(pools.map(p => p.chain))];
    
    return chains.map(chain => {
      const chainPools = pools.filter(p => p.chain === chain);
      const bestPool = chainPools.sort((a, b) => b.apy - a.apy)[0];
      const calculation = this.calculateReward(bestPool, principal, durationDays);
      
      return {
        chain,
        bestPool: bestPool.protocol,
        apy: bestPool.apy,
        projectedReward: calculation.projectedReward,
        riskLevel: bestPool.riskLevel,
        tvl: bestPool.tvl
      };
    }).sort((a, b) => b.projectedReward - a.projectedReward);
  }

  /**
   * Get market statistics
   */
  getMarketStats(): any {
    const allPools = this.rewardPools;
    
    // Average APY by chain
    const apyByChain: Record<string, number> = {};
    const poolsByChain: Record<string, number> = {};
    
    allPools.forEach(pool => {
      if (!apyByChain[pool.chain]) {
        apyByChain[pool.chain] = 0;
        poolsByChain[pool.chain] = 0;
      }
      apyByChain[pool.chain] += pool.apy;
      poolsByChain[pool.chain]++;
    });
    
    Object.keys(apyByChain).forEach(chain => {
      apyByChain[chain] = apyByChain[chain] / poolsByChain[chain];
    });
    
    // Total TVL
    const totalTvl = allPools.reduce((sum, pool) => sum + pool.tvl, 0);
    
    // Highest APY
    const highestApy = Math.max(...allPools.map(p => p.apy));
    
    // Lowest risk pools count
    const lowRiskPools = allPools.filter(p => p.riskLevel === 'low').length;
    
    return {
      totalPools: allPools.length,
      totalTvl,
      averageApy: allPools.reduce((sum, p) => sum + p.apy, 0) / allPools.length,
      highestApy,
      lowRiskPools,
      apyByChain,
      topProtocols: this.getTopProtocols(),
      supportedChains: [...new Set(allPools.map(p => p.chain))],
      supportedTokens: [...new Set(allPools.map(p => p.token))]
    };
  }

  /**
   * Get top protocols by TVL
   */
  private getTopProtocols(): any[] {
    const protocolTvl: Record<string, number> = {};
    
    this.rewardPools.forEach(pool => {
      if (!protocolTvl[pool.protocol]) {
        protocolTvl[pool.protocol] = 0;
      }
      protocolTvl[pool.protocol] += pool.tvl;
    });
    
    return Object.entries(protocolTvl)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([protocol, tvl]) => ({ protocol, tvl }));
  }
}

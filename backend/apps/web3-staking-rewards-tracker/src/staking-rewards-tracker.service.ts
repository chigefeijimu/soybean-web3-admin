import { Injectable } from '@nestjs/common';

interface StakingPosition {
  protocol: string;
  chain: string;
  token: string;
  stakedAmount: number;
  valueUsd: number;
  rewards: number;
  rewardsUsd: number;
  apy: number;
  lockPeriod: number;
  unlockDate?: string;
  status: 'active' | 'unlocking' | 'claimed';
}

interface RewardsHistory {
  date: string;
  protocol: string;
  chain: string;
  amount: number;
  valueUsd: number;
  token: string;
}

interface StakingPool {
  protocol: string;
  chain: string;
  token: string;
  apy: number;
  tvl: number;
  minStake: number;
  lockPeriod: number;
  risk: 'low' | 'medium' | 'high';
  category: string;
}

@Injectable()
export class StakingRewardsTrackerService {
  private readonly supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'avalanche',
    'bsc',
    'base',
    'solana',
    'cosmos',
    'cardano',
  ];

  private readonly supportedProtocols = [
    { name: 'Lido', chain: 'ethereum', token: 'stETH', category: 'Liquid Staking' },
    { name: 'Rocket Pool', chain: 'ethereum', token: 'rETH', category: 'Liquid Staking' },
    { name: 'Frax Ether', chain: 'ethereum', token: 'frxETH', category: 'Liquid Staking' },
    { name: 'Ankr', chain: 'ethereum', token: 'ankrETH', category: 'Liquid Staking' },
    { name: 'Stakewise', chain: 'ethereum', token: 'sETH2', category: 'Liquid Staking' },
    { name: 'Curve', chain: 'ethereum', token: 'crvETH', category: 'LP Staking' },
    { name: 'Convex', chain: 'ethereum', token: 'cvxCRV', category: 'LP Staking' },
    { name: 'Aave', chain: 'ethereum', token: 'stAAVE', category: 'Liquid Staking' },
    { name: 'Compound', chain: 'ethereum', token: 'cETH', category: 'Lending' },
    { name: 'Uniswap', chain: 'ethereum', token: 'UNI-V3', category: 'LP Staking' },
    { name: 'QuickSwap', chain: 'polygon', token: 'QUICK', category: 'Liquid Staking' },
    { name: 'Aave', chain: 'polygon', token: 'stMATIC', category: 'Liquid Staking' },
    { name: 'Gamma', chain: 'polygon', token: 'GAMMA', category: 'LP Staking' },
    { name: 'GMX', chain: 'arbitrum', token: 'GMX', category: 'Perpetual Staking' },
    { name: 'Gains Network', chain: 'arbitrum', token: 'GNS', category: 'Perpetual Staking' },
    { name: 'Aave', chain: 'avalanche', token: 'stAVAX', category: 'Liquid Staking' },
    { name: 'Benqi', chain: 'avalanche', token: 'sAVAX', category: 'Liquid Staking' },
    { name: 'PancakeSwap', chain: 'bsc', token: 'CAKE', category: 'LP Staking' },
    { name: 'Alpaca', chain: 'bsc', token: 'ALPACA', category: 'Lending' },
    { name: 'Venus', chain: 'bsc', token: 'vBNB', category: 'Lending' },
    { name: 'Aerodrome', chain: 'base', token: 'AERO', category: 'LP Staking' },
    { name: 'Curve', chain: 'base', token: 'crvUSD', category: 'LP Staking' },
    { name: 'Marinade', chain: 'solana', token: 'mSOL', category: 'Liquid Staking' },
    { name: 'JPool', chain: 'solana', token: 'JPOOL', category: 'Liquid Staking' },
    { name: 'Lido', chain: 'solana', token: 'stSOL', category: 'Liquid Staking' },
    { name: 'Cosmos', chain: 'cosmos', token: 'ATOM', category: 'Native Staking' },
    { name: 'Osmosis', chain: 'cosmos', token: 'OSMO', category: 'LP Staking' },
    { name: 'Sommelier', chain: 'cosmos', token: 'SOMM', category: 'Liquid Staking' },
    { name: 'Cardano', chain: 'cardano', token: 'ADA', category: 'Native Staking' },
    { name: 'Minswap', chain: 'cardano', token: 'MIN', category: 'LP Staking' },
  ];

  async getStakingRewards(address: string, chain?: string): Promise<any> {
    const positions = await this.getStakingPositions(address, chain);
    
    const totalRewards = positions.reduce((sum, p) => sum + p.rewardsUsd, 0);
    const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
    
    return {
      address,
      positionCount: positions.length,
      totalStakedUsd: totalValue,
      totalRewardsUsd: totalRewards,
      positions,
    };
  }

  async getStakingPositions(address: string, chain?: string): Promise<StakingPosition[]> {
    // Generate mock staking positions based on address
    const positions: StakingPosition[] = [];
    const chains = chain ? [chain] : this.supportedChains.slice(0, 5);
    
    const protocols = this.supportedProtocols.filter(p => 
      !chain || p.chain === chain
    );
    
    // Generate deterministic positions based on address hash
    const hash = this.hashCode(address);
    const numPositions = (Math.abs(hash) % 5) + 1;
    
    for (let i = 0; i < numPositions && i < protocols.length; i++) {
      const protocol = protocols[(Math.abs(hash + i) % protocols.length)];
      const stakedAmount = (Math.abs(hash * (i + 1)) % 10000) + 100;
      const apy = 3 + (Math.abs(hash * (i + 1)) % 12);
      const rewards = stakedAmount * (apy / 100) * 0.25;
      
      positions.push({
        protocol: protocol.name,
        chain: protocol.chain,
        token: protocol.token,
        stakedAmount,
        valueUsd: stakedAmount * this.getTokenPrice(protocol.token),
        rewards,
        rewardsUsd: rewards * this.getTokenPrice(protocol.token),
        apy,
        lockPeriod: protocol.category === 'Native Staking' ? 21 : 0,
        unlockDate: protocol.category === 'Native Staking' 
          ? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        status: 'active',
      });
    }
    
    return positions;
  }

  async getSupportedProtocols(): Promise<any> {
    return {
      protocols: this.supportedProtocols.map(p => ({
        name: p.name,
        chain: p.chain,
        token: p.token,
        category: p.category,
      })),
      total: this.supportedProtocols.length,
    };
  }

  async getSupportedChains(): Promise<string[]> {
    return this.supportedChains;
  }

  async getStakingOverview(address: string): Promise<any> {
    const positions = await this.getStakingPositions(address);
    
    const byChain: Record<string, { valueUsd: number; rewardsUsd: number }> = {};
    const byProtocol: Record<string, { valueUsd: number; rewardsUsd: number }> = {};
    const byCategory: Record<string, { valueUsd: number; rewardsUsd: number }> = {};
    
    for (const pos of positions) {
      // By Chain
      if (!byChain[pos.chain]) {
        byChain[pos.chain] = { valueUsd: 0, rewardsUsd: 0 };
      }
      byChain[pos.chain].valueUsd += pos.valueUsd;
      byChain[pos.chain].rewardsUsd += pos.rewardsUsd;
      
      // By Protocol
      if (!byProtocol[pos.protocol]) {
        byProtocol[pos.protocol] = { valueUsd: 0, rewardsUsd: 0 };
      }
      byProtocol[pos.protocol].valueUsd += pos.valueUsd;
      byProtocol[pos.protocol].rewardsUsd += pos.rewardsUsd;
      
      // By Category
      const protocol = this.supportedProtocols.find(p => p.name === pos.protocol);
      const category = protocol?.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = { valueUsd: 0, rewardsUsd: 0 };
      }
      byCategory[category].valueUsd += pos.valueUsd;
      byCategory[category].rewardsUsd += pos.rewardsUsd;
    }
    
    const totalValue = positions.reduce((sum, p) => sum + p.valueUsd, 0);
    const totalRewards = positions.reduce((sum, p) => sum + p.rewardsUsd, 0);
    
    return {
      address,
      totalValueUsd: totalValue,
      totalRewardsUsd: totalRewards,
      averageApy: positions.length > 0 
        ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length 
        : 0,
      positionCount: positions.length,
      byChain,
      byProtocol,
      byCategory,
    };
  }

  async getRewardsHistory(
    address: string,
    chain?: string,
    days: number = 30,
  ): Promise<RewardsHistory[]> {
    const history: RewardsHistory[] = [];
    const positions = await this.getStakingPositions(address, chain);
    const hash = this.hashCode(address);
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const pos of positions) {
        // Generate daily rewards with some variance
        const dailyReward = pos.rewards / 365 * (0.8 + Math.random() * 0.4);
        
        history.push({
          date: dateStr,
          protocol: pos.protocol,
          chain: pos.chain,
          amount: dailyReward,
          valueUsd: dailyReward * this.getTokenPrice(pos.token),
          token: pos.token,
        });
      }
    }
    
    return history.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getRewardsCalculators(): Promise<any> {
    return {
      calculators: [
        {
          name: 'Simple Interest',
          formula: 'Principal × (APY/100) × (Days/365)',
          description: 'Calculate simple staking rewards',
        },
        {
          name: 'Compound Interest',
          formula: 'Principal × (1 + APY/365)^(Days) - Principal',
          description: 'Calculate compound staking rewards with daily compounding',
        },
        {
          name: 'Lock Period Bonus',
          formula: 'Base APY × (1 + Lock Bonus)',
          description: 'Calculate rewards with lock period bonus',
        },
      ],
    };
  }

  async calculatePotentialRewards(params: {
    protocol: string;
    chain: string;
    amount: number;
    duration: number;
  }): Promise<any> {
    const { protocol, chain, amount, duration } = params;
    
    // Get base APY from pool data
    const apy = 5 + (this.hashCode(protocol + chain) % 15);
    
    // Simple interest
    const simpleRewards = amount * (apy / 100) * (duration / 365);
    
    // Compound interest (daily)
    const compoundRewards = amount * Math.pow(1 + apy / 36500, duration) - amount;
    
    return {
      protocol,
      chain,
      principal: amount,
      duration,
      apy,
      simpleRewards,
      compoundRewards,
      effectiveApy: ((compoundRewards / amount) * (365 / duration)) * 100,
      estimatedValueUsd: compoundRewards * 3000, // Assuming ETH price
    };
  }

  async getTopStakingPools(chain?: string, limit: number = 10): Promise<StakingPool[]> {
    let pools = this.supportedProtocols.map(p => {
      const poolApy = 3 + (this.hashCode(p.name + p.chain) % 15);
      const poolTvl = 1000000 + (this.hashCode(p.name + p.chain) % 100000000);
      
      return {
        protocol: p.name,
        chain: p.chain,
        token: p.token,
        apy: poolApy,
        tvl: poolTvl,
        minStake: p.category === 'Native Staking' ? 0.001 : 100,
        lockPeriod: p.category === 'Native Staking' ? 21 : 0,
        risk: poolApy > 10 ? 'high' : poolApy > 6 ? 'medium' : 'low',
        category: p.category,
      } as StakingPool;
    });
    
    if (chain) {
      pools = pools.filter(p => p.chain === chain);
    }
    
    // Sort by APY
    pools.sort((a, b) => b.apy - a.apy);
    
    return pools.slice(0, limit);
  }

  async getApyComparison(chain?: string): Promise<any> {
    const pools = await this.getTopStakingPools(chain, 20);
    
    const byChain: Record<string, { averageApy: number; poolCount: number }> = {};
    const byCategory: Record<string, { averageApy: number; poolCount: number }> = {};
    
    for (const pool of pools) {
      // By Chain
      if (!byChain[pool.chain]) {
        byChain[pool.chain] = { averageApy: 0, poolCount: 0 };
      }
      byChain[pool.chain].averageApy += pool.apy;
      byChain[pool.chain].poolCount++;
      
      // By Category
      if (!byCategory[pool.category]) {
        byCategory[pool.category] = { averageApy: 0, poolCount: 0 };
      }
      byCategory[pool.category].averageApy += pool.apy;
      byCategory[pool.category].poolCount++;
    }
    
    // Calculate averages
    for (const chain of Object.keys(byChain)) {
      byChain[chain].averageApy /= byChain[chain].poolCount;
    }
    for (const category of Object.keys(byCategory)) {
      byCategory[category].averageApy /= byCategory[category].poolCount;
    }
    
    return {
      byChain,
      byCategory,
      topPools: pools.slice(0, 10),
    };
  }

  private getTokenPrice(token: string): number {
    const prices: Record<string, number> = {
      ETH: 3000,
      stETH: 2950,
      rETH: 3100,
      frxETH: 2980,
      ankrETH: 2960,
      sETH2: 2940,
      crvETH: 2800,
      cvxCRV: 3,
      stAAVE: 250,
      cETH: 280,
      MATIC: 0.9,
      stMATIC: 0.85,
      GAMMA: 0.02,
      AVAX: 35,
      stAVAX: 33,
      sAVAX: 34,
      BNB: 600,
      CAKE: 3,
      ALPACA: 0.4,
      vBNB: 0.005,
      BASE: 1.5,
      AERO: 1.2,
      crvUSD: 1,
      SOL: 120,
      mSOL: 115,
      stSOL: 118,
      JPOOL: 0.8,
      ATOM: 9,
      OSMO: 0.6,
      SOMM: 2,
      ADA: 0.5,
      MIN: 0.1,
      GNS: 4,
      GMX: 45,
      QUICK: 80,
      UNI: 10,
    };
    
    return prices[token] || 1;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

import { Injectable } from '@nestjs/common';

export interface Validator {
  id: string;
  name: string;
  chain: string;
  address: string;
  status: 'active' | 'inactive' | 'slashed' | 'pending';
  uptime: number;
  apr: number;
  totalStaked: number;
  delegators: number;
  commission: number;
  firstSeen: string;
  lastReward: string;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  slashHistory: {
    count: number;
    totalAmount: number;
    lastSlash: string | null;
  };
  rank: number;
  imageUrl?: string;
}

export interface ChainStats {
  chain: string;
  totalValidators: number;
  totalStaked: number;
  avgApr: number;
  avgUptime: number;
  activeValidators: number;
  slashedValidators: number;
}

export interface ValidatorPerformanceResponse {
  validators: Validator[];
  totalValidators: number;
  page: number;
  pageSize: number;
  totalPages: number;
  chainStats: ChainStats[];
}

@Injectable()
export class StakingValidatorPerformanceService {
  private readonly supportedChains = [
    'ethereum',
    'cosmos',
    'polkadot',
    'solana',
    'cardano',
    'avalanche',
    'polygon',
    'near',
  ];

  private readonly chainNames: Record<string, string> = {
    ethereum: 'Ethereum 2.0',
    cosmos: 'Cosmos',
    polkadot: 'Polkadot',
    solana: 'Solana',
    cardano: 'Cardano',
    avalanche: 'Avalanche',
    polygon: 'Polygon',
    near: 'NEAR',
  };

  private generateMockValidators(chain: string, count: number): Validator[] {
    const validators: Validator[] = [];
    const statuses: Validator['status'][] = ['active', 'active', 'active', 'active', 'inactive', 'pending', 'slashed'];
    
    const validatorNames = [
      'Lido',
      'Rocket Pool',
      'Coinbase Cloud',
      'Staked',
      'Staking Rewards',
      'Allnodes',
      'Stakefish',
      'Staked.us',
      'Bitcoin Suisse',
      'D架',
      'Ankr',
      'KuCoin',
      'Binance',
      'OKX',
      'Bitget',
      'Gate.io',
      'Poloniex',
      'Huobi',
      'Bybit',
      'Gemini',
    ];

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const uptime = status === 'active' ? 95 + Math.random() * 5 : status === 'inactive' ? 50 + Math.random() * 30 : status === 'pending' ? 0 : 80 + Math.random() * 15;
      
      validators.push({
        id: `${chain}-validator-${i + 1}`,
        name: validatorNames[i % validatorNames.length] || `Validator ${i + 1}`,
        chain: this.chainNames[chain] || chain,
        address: `0x${this.generateRandomAddress()}`,
        status,
        uptime: Math.round(uptime * 100) / 100,
        apr: status === 'active' ? 3 + Math.random() * 8 : 0,
        totalStaked: Math.floor(10000 + Math.random() * 500000),
        delegators: Math.floor(50 + Math.random() * 5000),
        commission: Math.floor(5 + Math.random() * 15),
        firstSeen: this.getRandomDate(2023, 2025),
        lastReward: this.getRandomDate(2025, 2026),
        performance: {
          daily: status === 'active' ? Math.round((Math.random() * 2 - 0.5) * 100) / 100 : 0,
          weekly: status === 'active' ? Math.round((Math.random() * 10 - 2) * 100) / 100 : 0,
          monthly: status === 'active' ? Math.round((Math.random() * 40 - 10) * 100) / 100 : 0,
          yearly: status === 'active' ? Math.round((Math.random() * 100 - 20) * 100) / 100 : 0,
        },
        slashHistory: {
          count: Math.floor(Math.random() * 3),
          totalAmount: Math.floor(Math.random() * 100),
          lastSlash: Math.random() > 0.7 ? this.getRandomDate(2024, 2025) : null,
        },
        rank: i + 1,
      });
    }

    return validators.sort((a, b) => b.totalStaked - a.totalStaked).map((v, i) => ({ ...v, rank: i + 1 }));
  }

  private generateRandomAddress(): string {
    return Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private getRandomDate(startYear: number, endYear: number): string {
    const start = new Date(startYear, 0, 1).getTime();
    const end = new Date(endYear, 11, 31).getTime();
    const date = new Date(start + Math.random() * (end - start));
    return date.toISOString().split('T')[0];
  }

  async getValidators(
    chain?: string,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'staked',
    status?: string,
  ): Promise<ValidatorPerformanceResponse> {
    let allValidators: Validator[] = [];
    
    const chainsToQuery = chain ? [chain] : this.supportedChains;
    
    for (const c of chainsToQuery) {
      const count = c === 'ethereum' ? 50 : c === 'cosmos' ? 40 : c === 'solana' ? 30 : 20;
      const validators = this.generateMockValidators(c, count);
      allValidators = [...allValidators, ...validators];
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      allValidators = allValidators.filter(v => v.status === status);
    }

    // Sort
    switch (sortBy) {
      case 'staked':
        allValidators.sort((a, b) => b.totalStaked - a.totalStaked);
        break;
      case 'apr':
        allValidators.sort((a, b) => b.apr - a.apr);
        break;
      case 'uptime':
        allValidators.sort((a, b) => b.uptime - a.uptime);
        break;
      case 'delegators':
        allValidators.sort((a, b) => b.delegators - a.delegators);
        break;
      default:
        allValidators.sort((a, b) => a.rank - b.rank);
    }

    // Reassign ranks after sorting
    allValidators = allValidators.map((v, i) => ({ ...v, rank: i + 1 }));

    const totalValidators = allValidators.length;
    const totalPages = Math.ceil(totalValidators / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedValidators = allValidators.slice(start, start + pageSize);

    // Generate chain stats
    const chainStats: ChainStats[] = chainsToQuery.map(c => {
      const chainValidators = allValidators.filter(v => 
        v.chain.toLowerCase() === this.chainNames[c]?.toLowerCase() || v.chain.toLowerCase() === c
      );
      return {
        chain: this.chainNames[c] || c,
        totalValidators: chainValidators.length,
        totalStaked: chainValidators.reduce((sum, v) => sum + v.totalStaked, 0),
        avgApr: chainValidators.length > 0 
          ? chainValidators.reduce((sum, v) => sum + v.apr, 0) / chainValidators.length 
          : 0,
        avgUptime: chainValidators.length > 0 
          ? chainValidators.reduce((sum, v) => sum + v.uptime, 0) / chainValidators.length 
          : 0,
        activeValidators: chainValidators.filter(v => v.status === 'active').length,
        slashedValidators: chainValidators.filter(v => v.status === 'slashed').length,
      };
    });

    return {
      validators: paginatedValidators,
      totalValidators,
      page,
      pageSize,
      totalPages,
      chainStats,
    };
  }

  async getValidatorById(id: string): Promise<Validator | null> {
    const [chain, index] = id.split('-validator-');
    if (!chain || !index) return null;
    
    const validators = this.generateMockValidators(chain, parseInt(index) || 10);
    return validators[0] || null;
  }

  async getChainStats(chain: string): Promise<ChainStats | null> {
    const response = await this.getValidators(chain);
    return response.chainStats[0] || null;
  }

  async getTopValidators(limit: number = 10): Promise<Validator[]> {
    const response = await this.getValidators(undefined, 1, limit, 'staked');
    return response.validators;
  }

  async getValidatorPerformance(validatorId: string): Promise<any> {
    const validator = await this.getValidatorById(validatorId);
    if (!validator) return null;

    // Generate performance history
    const performanceHistory = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      performanceHistory.push({
        date: date.toISOString().split('T')[0],
        reward: Math.floor(Math.random() * 100) + 10,
        uptime: 95 + Math.random() * 5,
      });
    }

    return {
      validator,
      performanceHistory,
      estimatedAnnualReward: validator.totalStaked * (validator.apr / 100),
      riskScore: this.calculateRiskScore(validator),
    };
  }

  private calculateRiskScore(validator: Validator): number {
    let score = 100;
    
    // Deduct for slash history
    score -= validator.slashHistory.count * 15;
    
    // Deduct for low uptime
    if (validator.uptime < 95) score -= (95 - validator.uptime) * 2;
    
    // Deduct for high commission
    if (validator.commission > 15) score -= (validator.commission - 15) * 2;
    
    // Deduct for inactive status
    if (validator.status !== 'active') score -= 30;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getSupportedChains(): string[] {
    return this.supportedChains.map(c => ({
      id: c,
      name: this.chainNames[c],
    }));
  }
}

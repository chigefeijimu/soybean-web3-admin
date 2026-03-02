import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface ValidatorInfo {
  validatorAddress: string;
  chain: string;
  moniker: string;
  status: string;
  uptime: number;
  commission: number;
  delegators: number;
  tokens: string;
  rank?: number;
 Apr?: number;
  slashHistory?: SlashInfo[];
  rewardHistory?: RewardInfo[];
}

export interface SlashInfo {
  height: number;
  timestamp: string;
  reason: string;
  amount: string;
}

export interface RewardInfo {
  timestamp: string;
  amount: string;
  hash: string;
}

export interface ChainStats {
  chain: string;
  totalValidators: number;
  activeValidators: number;
  totalStaked: string;
  avgUptime: number;
  avgApr: number;
}

@Injectable()
export class ValidatorTrackerService {
  private readonly ethereumBeaconChain = 'https:// beaconcha.in/api/v1';
  private readonly cosmosHubApi = 'https://api.cosmos.network';
  private readonly polygonApi = 'https://polygon-api.panarchy.org';
  private readonly solanaApi = 'https://api.mainnet-beta.solana.com';

  // Mock data for demonstration - in production, these would be real API calls
  private getMockValidators(chain: string): ValidatorInfo[] {
    const validators: Record<string, ValidatorInfo[]> = {
      ethereum: [
        { validatorAddress: '0x1a...3b2c', chain: 'ethereum', moniker: 'Lido', status: 'active', uptime: 99.95, commission: 10, delegators: 15234, tokens: '4.2M ETH', rank: 1, Apr: 3.8 },
        { validatorAddress: '0x2b...4c3d', chain: 'ethereum', moniker: 'Rocket Pool', status: 'active', uptime: 99.89, commission: 15, delegators: 8932, tokens: '1.8M ETH', rank: 2, Apr: 3.6 },
        { validatorAddress: '0x3c...5d4e', chain: 'ethereum', moniker: 'Coinbase Cloud', status: 'active', uptime: 99.92, commission: 8, delegators: 12345, tokens: '2.1M ETH', rank: 3, Apr: 3.9 },
        { validatorAddress: '0x4d...6e5f', chain: 'ethereum', moniker: 'Staked.us', status: 'active', uptime: 99.78, commission: 12, delegators: 5678, tokens: '890K ETH', rank: 5, Apr: 3.5 },
        { validatorAddress: '0x5e...7f6g', chain: 'ethereum', moniker: 'Staking Rewards', status: 'inactive', uptime: 98.45, commission: 5, delegators: 2345, tokens: '450K ETH', rank: 10, Apr: 2.1 },
      ],
      cosmos: [
        { validatorAddress: 'cosmos1a...', chain: 'cosmos', moniker: 'Cosmos Hub', status: 'active', uptime: 99.98, commission: 5, delegators: 45000, tokens: '45M ATOM', rank: 1, Apr: 14.2 },
        { validatorAddress: 'cosmos1b...', chain: 'cosmos', moniker: 'Binance Staking', status: 'active', uptime: 99.95, commission: 10, delegators: 38000, tokens: '38M ATOM', rank: 2, Apr: 13.8 },
        { validatorAddress: 'cosmos1c...', chain: 'cosmos', moniker: 'Kraken', status: 'active', uptime: 99.92, commission: 15, delegators: 28000, tokens: '28M ATOM', rank: 3, Apr: 13.5 },
        { validatorAddress: 'cosmos1d...', chain: 'cosmos', moniker: 'Figment', status: 'active', uptime: 99.88, commission: 8, delegators: 22000, tokens: '22M ATOM', rank: 5, Apr: 14.0 },
        { validatorAddress: 'cosmos1e...', chain: 'cosmos', moniker: 'Chorus One', status: 'inactive', uptime: 95.23, commission: 12, delegators: 8000, tokens: '8M ATOM', rank: 20, Apr: 8.5 },
      ],
      polygon: [
        { validatorAddress: '0xabc...', chain: 'polygon', moniker: 'Polygon Foundation', status: 'active', uptime: 99.99, commission: 0, delegators: 125000, tokens: '3.2B MATIC', rank: 1, Apr: 6.8 },
        { validatorAddress: '0xdef...', chain: 'polygon', moniker: 'Ankr', status: 'active', uptime: 99.95, commission: 15, delegators: 45000, tokens: '890M MATIC', rank: 2, Apr: 5.9 },
        { validatorAddress: '0x123...', chain: 'polygon', moniker: 'Everstake', status: 'active', uptime: 99.92, commission: 12, delegators: 38000, tokens: '720M MATIC', rank: 3, Apr: 6.2 },
        { validatorAddress: '0x456...', chain: 'polygon', moniker: 'RockX', status: 'active', uptime: 99.88, commission: 10, delegators: 28000, tokens: '520M MATIC', rank: 5, Apr: 6.4 },
        { validatorAddress: '0x789...', chain: 'polygon', moniker: 'Staking Rewards', status: 'inactive', uptime: 92.34, commission: 8, delegators: 5000, tokens: '120M MATIC', rank: 15, Apr: 3.2 },
      ],
      solana: [
        { validatorAddress: 'vote1a...', chain: 'solana', moniker: 'Solana Foundation', status: 'active', uptime: 99.99, commission: 0, delegators: 250000, tokens: '470M SOL', rank: 1, Apr: 6.5 },
        { validatorAddress: 'vote1b...', chain: 'solana', moniker: 'Coinbase', status: 'active', uptime: 99.97, commission: 8, delegators: 180000, tokens: '320M SOL', rank: 2, Apr: 6.2 },
        { validatorAddress: 'vote1c...', chain: 'solana', moniker: 'Binance', status: 'active', uptime: 99.95, commission: 10, delegators: 150000, tokens: '280M SOL', rank: 3, Apr: 6.0 },
        { validatorAddress: 'vote1d...', chain: 'solana', moniker: 'Kraken', status: 'active', uptime: 99.92, commission: 7, delegators: 95000, tokens: '180M SOL', rank: 5, Apr: 6.3 },
        { validatorAddress: 'vote1e...', chain: 'solana', moniker: 'Figment', status: 'inactive', uptime: 94.56, commission: 12, delegators: 12000, tokens: '45M SOL', rank: 25, Apr: 3.8 },
      ],
    };

    return validators[chain] || [];
  }

  private getMockSlashHistory(validatorAddress: string): SlashInfo[] {
    // Simulated slash history
    const slashHistory: SlashInfo[] = [];
    const rand = Math.random();
    
    if (rand > 0.7) {
      slashHistory.push({
        height: Math.floor(Math.random() * 1000000) + 15000000,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Double signing',
        amount: (Math.random() * 0.1).toFixed(4) + ' ETH',
      });
    }
    
    return slashHistory;
  }

  private getMockRewardHistory(validatorAddress: string): RewardInfo[] {
    const rewards: RewardInfo[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 7; i++) {
      rewards.push({
        timestamp: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
        amount: (Math.random() * 10 + 1).toFixed(4) + ' ETH',
        hash: '0x' + Math.random().toString(16).substr(2, 64),
      });
    }
    
    return rewards;
  }

  async getValidators(chain: string, status?: string): Promise<ValidatorInfo[]> {
    let validators = this.getMockValidators(chain);
    
    if (status) {
      validators = validators.filter(v => v.status === status);
    }
    
    // Add slash and reward history
    return validators.map(v => ({
      ...v,
      slashHistory: this.getMockSlashHistory(v.validatorAddress),
      rewardHistory: this.getMockRewardHistory(v.validatorAddress),
    }));
  }

  async getValidatorByAddress(chain: string, address: string): Promise<ValidatorInfo | null> {
    const validators = this.getMockValidators(chain);
    const validator = validators.find(v => v.validatorAddress === address);
    
    if (!validator) {
      return null;
    }
    
    return {
      ...validator,
      slashHistory: this.getMockSlashHistory(address),
      rewardHistory: this.getMockRewardHistory(address),
    };
  }

  async getTopValidators(chain: string, limit: number = 10): Promise<ValidatorInfo[]> {
    const validators = this.getMockValidators(chain);
    return validators
      .sort((a, b) => (b.rank || 999) - (a.rank || 999))
      .slice(0, limit)
      .map(v => ({
        ...v,
        slashHistory: this.getMockSlashHistory(v.validatorAddress),
      }));
  }

  async getChainStats(chain: string): Promise<ChainStats> {
    const validators = this.getMockValidators(chain);
    const activeValidators = validators.filter(v => v.status === 'active');
    
    return {
      chain,
      totalValidators: validators.length * 10,
      activeValidators: activeValidators.length * 8,
      totalStaked: this.calculateTotalStaked(validators),
      avgUptime: activeValidators.reduce((sum, v) => sum + v.uptime, 0) / activeValidators.length,
      avgApr: activeValidators.reduce((sum, v) => sum + (v.Apr || 0), 0) / activeValidators.length,
    };
  }

  private calculateTotalStaked(validators: ValidatorInfo[]): string {
    // Simulated calculation
    const mockTotals: Record<string, string> = {
      ethereum: '12.5M ETH',
      cosmos: '280M ATOM',
      polygon: '8.2B MATIC',
      solana: '420M SOL',
    };
    return mockTotals[validators[0]?.chain] || '0';
  }

  async getValidatorPerformance(chain: string, address: string, days: number = 30): Promise<any> {
    const validator = await this.getValidatorByAddress(chain, address);
    
    if (!validator) {
      return null;
    }
    
    // Generate performance data
    const performance = {
      validator,
      period: days,
      uptime: validator.uptime,
      totalRewards: (Math.random() * 100 + 10).toFixed(2) + ' ' + this.getChainSymbol(chain),
      avgRewardPerDay: (Math.random() * 3 + 0.5).toFixed(4) + ' ' + this.getChainSymbol(chain),
      delegatorCount: validator.delegators,
      commission: validator.commission,
     Apr: validator.Apr,
      score: Math.floor(validator.uptime * 100 - validator.commission * 0.5),
      riskAssessment: validator.uptime > 99.5 ? 'LOW' : validator.uptime > 98 ? 'MEDIUM' : 'HIGH',
      recommendations: this.generateRecommendations(validator),
    };
    
    return performance;
  }

  private getChainSymbol(chain: string): string {
    const symbols: Record<string, string> = {
      ethereum: 'ETH',
      cosmos: 'ATOM',
      polygon: 'MATIC',
      solana: 'SOL',
    };
    return symbols[chain] || 'TOKEN';
  }

  private generateRecommendations(validator: ValidatorInfo): string[] {
    const recommendations: string[] = [];
    
    if (validator.uptime < 99) {
      recommendations.push('Validator uptime is below 99%, consider redelegating');
    }
    
    if (validator.commission > 20) {
      recommendations.push('High commission rate may reduce your rewards');
    }
    
    if (validator.Apr && validator.Apr > 10) {
      recommendations.push('Excellent APY performance');
    }
    
    if (validator.status === 'inactive') {
      recommendations.push('Validator is currently inactive');
    }
    
    return recommendations;
  }

  async compareValidators(chain: string, addresses: string[]): Promise<any[]> {
    const comparisons = await Promise.all(
      addresses.map(async (address) => {
        const validator = await this.getValidatorByAddress(chain, address);
        if (!validator) return null;
        
        return {
          validator,
          uptime: validator.uptime,
          commission: validator.commission,
         Apr: validator.Apr,
          delegators: validator.delegators,
          rank: validator.rank,
          score: Math.floor(validator.uptime * 100 - validator.commission * 0.5 + (validator.Apr || 0) * 10),
        };
      })
    );
    
    return comparisons.filter(Boolean).sort((a, b) => b.score - a.score);
  }

  getSupportedChains(): string[] {
    return ['ethereum', 'cosmos', 'polygon', 'solana'];
  }

  async getStakingPools(chain: string): Promise<any[]> {
    // Staking pool data
    const pools: Record<string, any[]> = {
      ethereum: [
        { name: 'Lido', tvl: '4.2M ETH', Apr: 3.8, minStake: '0.01 ETH', url: 'https://lido.fi' },
        { name: 'Rocket Pool', tvl: '1.8M ETH', Apr: 3.6, minStake: '0.01 ETH', url: 'https://rocketpool.net' },
        { name: 'Frax Ether', tvl: '890K ETH', Apr: 3.4, minStake: '0.01 ETH', url: 'https://frax.finance' },
        { name: 'Stakewise', tvl: '450K ETH', Apr: 3.5, minStake: '0.01 ETH', url: 'https://stakewise.io' },
      ],
      cosmos: [
        { name: 'Cosmos Hub', tvl: '45M ATOM', Apr: 14.2, minStake: '1 ATOM', url: 'https://hub.cosmos.network' },
        { name: 'Osmosis', tvl: '120M OSMO', Apr: 12.5, minStake: '1 OSMO', url: 'https://osmosis.zone' },
        { name: 'Gravity Bridge', tvl: '35M GRAV', Apr: 15.0, minStake: '1 GRAV', url: 'https://gravitybridge.net' },
      ],
      polygon: [
        { name: 'Polygon Native', tvl: '3.2B MATIC', Apr: 6.8, minStake: '1 MATIC', url: 'https://polygon.technology' },
        { name: 'Ankr', tvl: '890M MATIC', Apr: 5.9, minStake: '100 MATIC', url: 'https://ankr.com' },
      ],
      solana: [
        { name: 'Solana Native', tvl: '470M SOL', Apr: 6.5, minStake: '1 SOL', url: 'https://solana.com' },
        { name: 'Marinade Finance', tvl: '180M SOL', Apr: 6.2, minStake: '1 SOL', url: 'https://marinade.finance' },
        { name: 'JPool', tvl: '45M SOL', Apr: 6.8, minStake: '1 SOL', url: 'https://jpool.one' },
      ],
    };
    
    return pools[chain] || [];
  }
}

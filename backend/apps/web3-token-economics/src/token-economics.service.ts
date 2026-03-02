import { Injectable } from '@nestjs/common';

interface TokenEconomics {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  totalSupply: number;
  circulatingSupply: number;
  maxSupply: number | null;
  marketCap: number;
  fullyDilutedValuation: number;
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  inflationRate: number;
  tokenAllocation: TokenAllocation[];
  vestingSchedule: VestingSchedule[];
  burnHistory: BurnRecord[];
  holdersCount: number;
  transferCount: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
}

interface TokenAllocation {
  category: string;
  percentage: number;
  amount: number;
  lockStatus: 'locked' | 'unlocked' | 'vesting';
  unlockDate?: string;
  description: string;
}

interface VestingSchedule {
  name: string;
  totalAmount: number;
  releasedAmount: number;
  lockedAmount: number;
  startDate: string;
  endDate: string;
  cliff: number;
  duration: number;
  tgePercent: number;
}

interface BurnRecord {
  date: string;
  amount: number;
  usdValue: number;
  txHash: string;
  type: 'manual' | 'auto' | 'fee-burn';
}

interface PopularToken {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  category: string;
}

@Injectable()
export class TokenEconomicsService {
  private popularTokens: PopularToken[] = [
    { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chain: 'ethereum', category: 'L1' },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', chain: 'ethereum', category: 'DeFi' },
    { symbol: 'AAVE', name: 'Aave', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', chain: 'ethereum', category: 'DeFi' },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771af9ca656af840dff83e8264ecf986ca', chain: 'ethereum', category: 'Oracle' },
    { symbol: 'CRV', name: 'Curve DAO', address: '0xd533a949740bb3306d119cc777fa900ba034cd52', chain: 'ethereum', category: 'DeFi' },
    { symbol: 'MKR', name: 'Maker', address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', chain: 'ethereum', category: 'DeFi' },
    { symbol: 'COMP', name: 'Compound', address: '0xc00e94cb662c3520282e6f5717214004a7f26888', chain: 'ethereum', category: 'DeFi' },
    { symbol: 'SNX', name: 'Synthetix', address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', chain: 'ethereum', category: 'DeFi' },
    { symbol: 'LDO', name: 'Lido DAO', address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32', chain: 'ethereum', category: 'LSD' },
    { symbol: 'RPL', name: 'Rocket Pool', address: '0xd33526068d116cd69f32a3f73f96d15a5f2f10a', chain: 'ethereum', category: 'LSD' },
  ];

  async getTokenEconomics(address: string, chain: string = 'ethereum'): Promise<TokenEconomics> {
    // Generate mock data based on token address hash for consistency
    const hash = this.hashCode(address);
    const tokenInfo = this.getTokenInfo(address, chain);
    
    const totalSupply = this.generateSupply(hash, 1000000000, 10000000000);
    const circulatingSupply = totalSupply * (0.3 + (hash % 50) / 100);
    const price = this.generatePrice(hash);
    const marketCap = circulatingSupply * price;
    const fdv = totalSupply * price;
    
    return {
      address: address.toLowerCase(),
      symbol: tokenInfo.symbol,
      name: tokenInfo.name,
      chain: chain,
      totalSupply,
      circulatingSupply,
      maxSupply: tokenInfo.symbol === 'ETH' ? null : totalSupply * 1.5,
      marketCap,
      fullyDilutedValuation: fdv,
      price,
      priceChange24h: (hash % 20) - 10,
      priceChange7d: (hash % 40) - 20,
      inflationRate: (hash % 5) + 1,
      tokenAllocation: this.generateAllocation(hash, totalSupply),
      vestingSchedule: this.generateVesting(hash, totalSupply),
      burnHistory: this.generateBurnHistory(hash),
      holdersCount: Math.floor(1000 + (hash % 100000)),
      transferCount: Math.floor(10000 + (hash % 1000000)),
      riskScore: hash % 100,
      riskLevel: this.getRiskLevel(hash % 100),
      riskFactors: this.getRiskFactors(hash % 100),
    };
  }

  async getPopularTokens(): Promise<PopularToken[]> {
    return this.popularTokens;
  }

  async getTokenList(chain: string = 'ethereum'): Promise<PopularToken[]> {
    return this.popularTokens.filter(t => t.chain === chain || chain === 'all');
  }

  private getTokenInfo(address: string, chain: string): { symbol: string; name: string } {
    const token = this.popularTokens.find(t => t.address.toLowerCase() === address.toLowerCase());
    if (token) {
      return { symbol: token.symbol, name: token.name };
    }
    // Generate consistent symbol/name from address
    const hash = this.hashCode(address);
    const symbols = ['TOK', 'COIN', 'TOKEN', 'PROTOCOL', 'DAO', 'FI', 'SWAP', 'YIELD', 'STACK', 'CHAIN'];
    const names = ['Token', 'Coin', 'Protocol', 'Network', 'Finance', 'Swap', 'Yield', 'Stack', 'Chain', 'Bridge'];
    return {
      symbol: symbols[hash % symbols.length] + (hash % 100),
      name: names[hash % names.length] + ' Token ' + (hash % 1000),
    };
  }

  private generateSupply(hash: number, min: number, max: number): number {
    return Math.floor(min + (hash % (max - min)));
  }

  private generatePrice(hash: number): number {
    const prices = [0.1, 0.5, 1, 5, 10, 20, 50, 100, 200, 500, 1000, 2500, 45000];
    return prices[hash % prices.length];
  }

  private generateAllocation(hash: number, totalSupply: number): TokenAllocation[] {
    const allocations: TokenAllocation[] = [
      {
        category: 'Community & Incentives',
        percentage: 40,
        amount: totalSupply * 0.4,
        lockStatus: 'vesting',
        description: 'Community rewards, airdrops, liquidity mining',
      },
      {
        category: 'Team & Advisors',
        percentage: 20,
        amount: totalSupply * 0.2,
        lockStatus: 'vesting',
        description: 'Team tokens with 4-year vesting',
      },
      {
        category: 'Investors',
        percentage: 20,
        amount: totalSupply * 0.2,
        lockStatus: 'vesting',
        description: 'Early investors with 2-year vesting',
      },
      {
        category: 'Treasury',
        percentage: 10,
        amount: totalSupply * 0.1,
        lockStatus: 'unlocked',
        description: 'Protocol treasury for development',
      },
      {
        category: 'Public Sale',
        percentage: 10,
        amount: totalSupply * 0.1,
        lockStatus: 'unlocked',
        description: 'Public sale and IDO',
      },
    ];
    
    // Adjust based on hash for variety
    if (hash % 3 === 0) {
      allocations[0].percentage = 50;
      allocations[0].amount = totalSupply * 0.5;
      allocations[1].percentage = 15;
      allocations[1].amount = totalSupply * 0.15;
    }
    
    return allocations;
  }

  private generateVesting(hash: number, totalSupply: number): VestingSchedule[] {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    
    return [
      {
        name: 'Team Vesting',
        totalAmount: totalSupply * 0.2,
        releasedAmount: totalSupply * 0.05,
        lockedAmount: totalSupply * 0.15,
        startDate,
        endDate: new Date(now.getFullYear() + 4, now.getMonth(), now.getDate()).toISOString().split('T')[0],
        cliff: 365,
        duration: 1460,
        tgePercent: 0,
      },
      {
        name: 'Investor Vesting',
        totalAmount: totalSupply * 0.2,
        releasedAmount: totalSupply * 0.1,
        lockedAmount: totalSupply * 0.1,
        startDate,
        endDate: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()).toISOString().split('T')[0],
        cliff: 180,
        duration: 730,
        tgePercent: 10,
      },
      {
        name: 'Community Rewards',
        totalAmount: totalSupply * 0.4,
        releasedAmount: totalSupply * 0.15,
        lockedAmount: totalSupply * 0.25,
        startDate,
        endDate: new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()).toISOString().split('T')[0],
        cliff: 0,
        duration: 1825,
        tgePercent: 5,
      },
    ];
  }

  private generateBurnHistory(hash: number): BurnRecord[] {
    const records: BurnRecord[] = [];
    const burnTypes: ('manual' | 'auto' | 'fee-burn')[] = ['manual', 'auto', 'fee-burn'];
    
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 30);
      
      records.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(10000 + (hash % 100000) * (i + 1)),
        usdValue: Math.floor(5000 + (hash % 50000) * (i + 1)),
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        type: burnTypes[hash % 3],
      });
    }
    
    return records;
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 85) return 'high';
    return 'critical';
  }

  private getRiskFactors(score: number): string[] {
    const allFactors = [
      'High team allocation (>20%)',
      'No clear token utility',
      'No vesting schedule',
      'Centralized ownership',
      'No burn mechanism',
      'Limited token distribution',
      'No community allocation',
      'Inflation risk',
      'Unlock schedule risk',
      'No buyback mechanism',
    ];
    
    const factors: string[] = [];
    for (let i = 0; i < Math.min(5, Math.floor(score / 20) + 1); i++) {
      factors.push(allFactors[(score + i) % allFactors.length]);
    }
    
    return factors;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

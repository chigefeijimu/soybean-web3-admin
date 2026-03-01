import { Injectable } from '@nestjs/common';

export interface TokenUnlock {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  unlockDate: string;
  unlockAmount: number;
  unlockPercentage: number;
  totalSupply: number;
  recipient: string;
  recipientType: 'team' | 'investor' | 'community' | 'treasury';
  description: string;
  status: 'upcoming' | 'unlocked' | 'partial';
  priceAtUnlock?: number;
  valueAtUnlock?: number;
}

@Injectable()
export class TokenUnlockService {
  // Simulated token unlock data
  private mockUnlocks: TokenUnlock[] = [
    {
      id: '1',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      tokenName: 'Uniswap',
      tokenSymbol: 'UNI',
      chain: 'ethereum',
      unlockDate: '2026-03-05',
      unlockAmount: 15000000,
      unlockPercentage: 1.5,
      totalSupply: 1000000000,
      recipient: 'Team',
      recipientType: 'team',
      description: 'Team vesting unlock',
      status: 'upcoming',
    },
    {
      id: '2',
      tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      tokenName: 'Aave',
      tokenSymbol: 'AAVE',
      chain: 'ethereum',
      unlockDate: '2026-03-10',
      unlockAmount: 3700000,
      unlockPercentage: 2.78,
      totalSupply: 16000000,
      recipient: 'Treasury',
      recipientType: 'treasury',
      description: 'Treasury vesting unlock',
      status: 'upcoming',
    },
    {
      id: '3',
      tokenAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
      tokenName: 'Chainlink',
      tokenSymbol: 'LINK',
      chain: 'ethereum',
      unlockDate: '2026-03-15',
      unlockAmount: 26000000,
      unlockPercentage: 2.6,
      totalSupply: 1000000000,
      recipient: 'Investors',
      recipientType: 'investor',
      description: 'Investor vesting unlock',
      status: 'upcoming',
    },
    {
      id: '4',
      tokenAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      tokenName: 'Polygon',
      tokenSymbol: 'MATIC',
      chain: 'ethereum',
      unlockDate: '2026-03-20',
      unlockAmount: 1900000000,
      unlockPercentage: 19,
      totalSupply: 10000000000,
      recipient: 'Team',
      recipientType: 'team',
      description: 'Team & advisor vesting',
      status: 'upcoming',
    },
    {
      id: '5',
      tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      tokenName: 'Wrapped Bitcoin',
      tokenSymbol: 'WBTC',
      chain: 'ethereum',
      unlockDate: '2026-03-25',
      unlockAmount: 500,
      unlockPercentage: 0.005,
      totalSupply: 100000,
      recipient: 'Treasury',
      recipientType: 'treasury',
      description: 'Treasury distribution',
      status: 'upcoming',
    },
    {
      id: '6',
      tokenAddress: '0x0f2d719407fdbeff09d87557abb7239651e9c608',
      tokenName: 'Synapse',
      tokenSymbol: 'SYN',
      chain: 'ethereum',
      unlockDate: '2026-04-01',
      unlockAmount: 7500000,
      unlockPercentage: 7.5,
      totalSupply: 100000000,
      recipient: 'Community',
      recipientType: 'community',
      description: 'Community airdrop & incentives',
      status: 'upcoming',
    },
    {
      id: '7',
      tokenAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52',
      tokenName: 'Curve DAO',
      tokenSymbol: 'CRV',
      chain: 'ethereum',
      unlockDate: '2026-04-05',
      unlockAmount: 50000000,
      unlockPercentage: 5,
      totalSupply: 1000000000,
      recipient: 'Team',
      recipientType: 'team',
      description: 'Team vesting milestone 2',
      status: 'upcoming',
    },
    {
      id: '8',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      tokenName: 'Uniswap',
      tokenSymbol: 'UNI',
      chain: 'ethereum',
      unlockDate: '2026-04-15',
      unlockAmount: 22000000,
      unlockPercentage: 2.2,
      totalSupply: 1000000000,
      recipient: 'Investors',
      recipientType: 'investor',
      description: 'Investor vesting round 3',
      status: 'upcoming',
    },
    {
      id: '9',
      tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      chain: 'ethereum',
      unlockDate: '2026-05-01',
      unlockAmount: 1000000000,
      unlockPercentage: 10,
      totalSupply: 10000000000,
      recipient: 'Treasury',
      recipientType: 'treasury',
      description: 'Quarterly treasury release',
      status: 'upcoming',
    },
    {
      id: '10',
      tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      tokenName: 'Aave',
      tokenSymbol: 'AAVE',
      chain: 'ethereum',
      unlockDate: '2026-05-15',
      unlockAmount: 3000000,
      unlockPercentage: 2.25,
      totalSupply: 16000000,
      recipient: 'Team',
      recipientType: 'team',
      description: 'Team vesting Q2',
      status: 'upcoming',
    },
  ];

  private mockTokenList = [
    { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap', symbol: 'UNI' },
    { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', name: 'Aave', symbol: 'AAVE' },
    { address: '0x514910771af9ca656af840dff83e8264ecf986ca', name: 'Chainlink', symbol: 'LINK' },
    { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', name: 'Polygon', symbol: 'MATIC' },
    { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', name: 'Wrapped Bitcoin', symbol: 'WBTC' },
    { address: '0x0f2d719407fdbeff09d87557abb7239651e9c608', name: 'Synapse', symbol: 'SYN' },
    { address: '0xd533a949740bb3306d119cc777fa900ba034cd52', name: 'Curve DAO', symbol: 'CRV' },
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin', symbol: 'USDC' },
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'Dai', symbol: 'DAI' },
    { address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', name: 'Lido DAO', symbol: 'LDO' },
  ];

  async getUpcomingUnlocks(days: number, chain: string): Promise<TokenUnlock[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return this.mockUnlocks
      .filter(u => u.chain === chain)
      .filter(u => {
        const unlockDate = new Date(u.unlockDate);
        return unlockDate >= now && unlockDate <= futureDate;
      })
      .sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime());
  }

  async getTokenUnlocks(tokenAddress: string, chain: string): Promise<TokenUnlock[]> {
    return this.mockUnlocks
      .filter(u => u.chain === chain && u.tokenAddress.toLowerCase() === tokenAddress.toLowerCase())
      .sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime());
  }

  async getCalendarView(months: number, chain: string): Promise<Record<string, TokenUnlock[]>> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);
    
    const unlocks = this.mockUnlocks
      .filter(u => u.chain === chain)
      .filter(u => {
        const unlockDate = new Date(u.unlockDate);
        return unlockDate >= now && unlockDate <= futureDate;
      });

    const calendar: Record<string, TokenUnlock[]> = {};
    
    unlocks.forEach(unlock => {
      const monthKey = unlock.unlockDate.substring(0, 7); // YYYY-MM
      if (!calendar[monthKey]) {
        calendar[monthKey] = [];
      }
      calendar[monthKey].push(unlock);
    });

    return calendar;
  }

  async getUnlockStats(chain: string): Promise<{
    totalUpcoming: number;
    totalValue: number;
    next7Days: number;
    next30Days: number;
    byRecipientType: Record<string, number>;
  }> {
    const unlocks = this.mockUnlocks.filter(u => u.chain === chain);
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingUnlocks = unlocks.filter(u => new Date(u.unlockDate) >= now);
    const next7DaysCount = unlocks.filter(u => {
      const date = new Date(u.unlockDate);
      return date >= now && date <= next7Days;
    }).length;
    const next30DaysCount = unlocks.filter(u => {
      const date = new Date(u.unlockDate);
      return date >= now && date <= next30Days;
    }).length;

    const byRecipientType: Record<string, number> = {};
    upcomingUnlocks.forEach(u => {
      byRecipientType[u.recipientType] = (byRecipientType[u.recipientType] || 0) + u.unlockAmount;
    });

    return {
      totalUpcoming: upcomingUnlocks.length,
      totalValue: upcomingUnlocks.reduce((sum, u) => sum + u.unlockAmount, 0),
      next7Days: next7DaysCount,
      next30Days: next30DaysCount,
      byRecipientType,
    };
  }

  async searchTokens(query: string): Promise<Array<{address: string; name: string; symbol: string}>> {
    const lowerQuery = query.toLowerCase();
    return this.mockTokenList.filter(
      t => t.name.toLowerCase().includes(lowerQuery) || 
           t.symbol.toLowerCase().includes(lowerQuery) ||
           t.address.toLowerCase().includes(lowerQuery)
    );
  }
}

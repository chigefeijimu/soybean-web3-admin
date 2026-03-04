import { Injectable } from '@nestjs/common';

export interface TokenUnlock {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  protocol: string;
  unlockDate: string;
  unlockAmount: number;
  unlockPercentage: number;
  totalSupply: number;
  category: 'team' | 'investor' | 'advisor' | 'community' | 'ecosystem';
  status: 'upcoming' | 'unlocked' | 'unlocking';
  priceAtUnlock?: number;
  valueAtUnlock?: number;
}

export interface UnlockStats {
  totalUnlocks: number;
  upcomingUnlocks: number;
  totalValueUnlocked: number;
  totalValueUpcoming: number;
  chainDistribution: { chain: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
}

@Injectable()
export class TokenUnlockService {
  private tokenUnlocks: TokenUnlock[] = [
    // Ethereum
    {
      id: 'eth-1',
      tokenName: 'Uniswap',
      tokenSymbol: 'UNI',
      chain: 'Ethereum',
      protocol: 'Uniswap',
      unlockDate: '2026-03-15',
      unlockAmount: 15000000,
      unlockPercentage: 1.5,
      totalSupply: 1000000000,
      category: 'team',
      status: 'upcoming',
    },
    {
      id: 'eth-2',
      tokenName: 'Aave',
      tokenSymbol: 'AAVE',
      chain: 'Ethereum',
      protocol: 'Aave',
      unlockDate: '2026-03-20',
      unlockAmount: 500000,
      unlockPercentage: 0.37,
      totalSupply: 16000000,
      category: 'team',
      status: 'upcoming',
    },
    {
      id: 'eth-3',
      tokenName: 'MakerDAO',
      tokenSymbol: 'MKR',
      chain: 'Ethereum',
      protocol: 'MakerDAO',
      unlockDate: '2026-04-01',
      unlockAmount: 2500,
      unlockPercentage: 0.25,
      totalSupply: 977631,
      category: 'investor',
      status: 'upcoming',
    },
    {
      id: 'eth-4',
      tokenName: 'Compound',
      tokenSymbol: 'COMP',
      chain: 'Ethereum',
      protocol: 'Compound',
      unlockDate: '2026-03-10',
      unlockAmount: 320000,
      unlockPercentage: 2.0,
      totalSupply: 10000000,
      category: 'ecosystem',
      status: 'upcoming',
    },
    // Arbitrum
    {
      id: 'arb-1',
      tokenName: 'Arbitrum',
      tokenSymbol: 'ARB',
      chain: 'Arbitrum',
      protocol: 'ArbitrumDAO',
      unlockDate: '2026-03-16',
      unlockAmount: 450000000,
      unlockPercentage: 4.5,
      totalSupply: 10000000000,
      category: 'investor',
      status: 'upcoming',
    },
    {
      id: 'arb-2',
      tokenName: 'GMX',
      tokenSymbol: 'GMX',
      chain: 'Arbitrum',
      protocol: 'GMX',
      unlockDate: '2026-04-05',
      unlockAmount: 25000,
      unlockPercentage: 2.5,
      totalSupply: 1000000,
      category: 'team',
      status: 'upcoming',
    },
    // Optimism
    {
      id: 'opt-1',
      tokenName: 'Optimism',
      tokenSymbol: 'OP',
      chain: 'Optimism',
      protocol: 'OptimismDAO',
      unlockDate: '2026-03-12',
      unlockAmount: 320000000,
      unlockPercentage: 3.2,
      totalSupply: 10000000000,
      category: 'investor',
      status: 'upcoming',
    },
    {
      id: 'opt-2',
      tokenName: 'Velodrome',
      tokenSymbol: 'VELO',
      chain: 'Optimism',
      protocol: 'Velodrome',
      unlockDate: '2026-03-25',
      unlockAmount: 50000000,
      unlockPercentage: 5.0,
      totalSupply: 1000000000,
      category: 'ecosystem',
      status: 'upcoming',
    },
    // Polygon
    {
      id: 'mat-1',
      tokenName: 'Polygon',
      tokenSymbol: 'MATIC',
      chain: 'Polygon',
      protocol: 'Polygon',
      unlockDate: '2026-03-18',
      unlockAmount: 190000000,
      unlockPercentage: 1.9,
      totalSupply: 10000000000,
      category: 'team',
      status: 'upcoming',
    },
    {
      id: 'mat-2',
      tokenName: 'QuickSwap',
      tokenSymbol: 'QUICK',
      chain: 'Polygon',
      protocol: 'QuickSwap',
      unlockDate: '2026-04-10',
      unlockAmount: 10000,
      unlockPercentage: 1.0,
      totalSupply: 1000000,
      category: 'advisor',
      status: 'upcoming',
    },
    // Avalanche
    {
      id: 'avax-1',
      tokenName: 'Avalanche',
      tokenSymbol: 'AVAX',
      chain: 'Avalanche',
      protocol: 'Avalanche',
      unlockDate: '2026-03-22',
      unlockAmount: 7250000,
      unlockPercentage: 2.9,
      totalSupply: 720000000,
      category: 'investor',
      status: 'upcoming',
    },
    // Solana
    {
      id: 'sol-1',
      tokenName: 'Solana',
      tokenSymbol: 'SOL',
      chain: 'Solana',
      protocol: 'Solana',
      unlockDate: '2026-03-08',
      unlockAmount: 15000000,
      unlockPercentage: 3.5,
      totalSupply: 500000000,
      category: 'team',
      status: 'upcoming',
    },
    // Base
    {
      id: 'base-1',
      tokenName: 'Base',
      tokenSymbol: 'BASE',
      chain: 'Base',
      protocol: 'BaseDAO',
      unlockDate: '2026-04-15',
      unlockAmount: 50000000,
      unlockPercentage: 5.0,
      totalSupply: 1000000000,
      category: 'ecosystem',
      status: 'upcoming',
    },
    // BSC
    {
      id: 'bsc-1',
      tokenName: 'PancakeSwap',
      tokenSymbol: 'CAKE',
      chain: 'BSC',
      protocol: 'PancakeSwap',
      unlockDate: '2026-03-14',
      unlockAmount: 1250000,
      unlockPercentage: 2.5,
      totalSupply: 500000000,
      category: 'team',
      status: 'upcoming',
    },
    {
      id: 'bsc-2',
      tokenName: 'Binance',
      tokenSymbol: 'BNB',
      chain: 'BSC',
      protocol: 'BNBChain',
      unlockDate: '2026-04-01',
      unlockAmount: 1000000,
      unlockPercentage: 1.0,
      totalSupply: 200000000,
      category: 'ecosystem',
      status: 'upcoming',
    },
  ];

  getUnlocks(filters?: {
    chain?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): TokenUnlock[] {
    let results = [...this.tokenUnlocks];

    if (filters?.chain) {
      results = results.filter((u) => u.chain.toLowerCase() === filters.chain!.toLowerCase());
    }
    if (filters?.category) {
      results = results.filter((u) => u.category === filters.category);
    }
    if (filters?.status) {
      results = results.filter((u) => u.status === filters.status);
    }
    if (filters?.startDate) {
      results = results.filter((u) => new Date(u.unlockDate) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      results = results.filter((u) => new Date(u.unlockDate) <= new Date(filters.endDate!));
    }

    return results.sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime());
  }

  getUnlockById(id: string): TokenUnlock | undefined {
    return this.tokenUnlocks.find((u) => u.id === id);
  }

  getStats(): UnlockStats {
    const now = new Date();
    const upcoming = this.tokenUnlocks.filter((u) => u.status === 'upcoming');
    const unlocked = this.tokenUnlocks.filter((u) => u.status === 'unlocked');

    const chainCounts = this.tokenUnlocks.reduce((acc, u) => {
      const existing = acc.find((c) => c.chain === u.chain);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ chain: u.chain, count: 1 });
      }
      return acc;
    }, [] as { chain: string; count: number }[]);

    const categoryCounts = this.tokenUnlocks.reduce((acc, u) => {
      const existing = acc.find((c) => c.category === u.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ category: u.category, count: 1 });
      }
      return acc;
    }, [] as { category: string; count: number }[]);

    return {
      totalUnlocks: this.tokenUnlocks.length,
      upcomingUnlocks: upcoming.length,
      totalValueUnlocked: unlocked.reduce((sum, u) => sum + (u.valueAtUnlock || 0), 0),
      totalValueUpcoming: upcoming.reduce((sum, u) => sum + (u.valueAtUnlock || u.unlockAmount * 10), 0),
      chainDistribution: chainCounts.sort((a, b) => b.count - a.count),
      categoryDistribution: categoryCounts.sort((a, b) => b.count - a.count),
    };
  }

  getUpcoming(days: number = 30): TokenUnlock[] {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.tokenUnlocks
      .filter((u) => u.status === 'upcoming' && new Date(u.unlockDate) >= now && new Date(u.unlockDate) <= future)
      .sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime());
  }

  getChains(): string[] {
    return [...new Set(this.tokenUnlocks.map((u) => u.chain))];
  }

  getProtocols(): string[] {
    return [...new Set(this.tokenUnlocks.map((u) => u.protocol))];
  }
}

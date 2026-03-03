import { Injectable } from '@nestjs/common';

interface BalanceSnapshot {
  timestamp: number;
  date: string;
  balance: string;
  balanceUsd: number;
  change24h: number;
  changePercent24h: number;
}

interface TokenBalance {
  chainId: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUsd: number;
  price: number;
  change24h: number;
}

interface BalanceChange {
  tokenAddress: string;
  symbol: string;
  chainId: string;
  previousBalance: string;
  currentBalance: string;
  changePercent: number;
  changeUsd: number;
  timestamp: number;
}

interface HolderInfo {
  address: string;
  balance: string;
  balanceUsd: number;
  percent: number;
  rank: number;
}

interface DistributionBucket {
  range: string;
  count: number;
  percent: number;
  totalBalance: string;
}

interface Statistics {
  totalBalanceUsd: number;
  totalTokens: number;
  chains: string[];
  avgHoldingDuration: number;
  largestHolding: TokenBalance;
  mostVolatile: TokenBalance;
  recentGains: number;
  recentLosses: number;
}

interface DashboardData {
  summary: {
    totalValue: number;
    change24h: number;
    changePercent24h: number;
    topChain: string;
    topToken: string;
  };
  portfolioSnapshots: BalanceSnapshot[];
  balanceChanges: BalanceChange[];
  chainDistribution: { chainId: string; value: number; percent: number }[];
  tokenDistribution: { token: string; value: number; percent: number }[];
}

const SUPPORTED_CHAINS = [
  { id: '1', name: 'Ethereum', symbol: 'ETH' },
  { id: '137', name: 'Polygon', symbol: 'MATIC' },
  { id: '42161', name: 'Arbitrum', symbol: 'ETH' },
  { id: '10', name: 'Optimism', symbol: 'ETH' },
  { id: '56', name: 'BSC', symbol: 'BNB' },
  { id: '8453', name: 'Base', symbol: 'ETH' },
  { id: '43114', name: 'Avalanche', symbol: 'AVAX' },
];

const MOCK_TOKENS = [
  { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', chainId: '1' },
  { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin', chainId: '1' },
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', chainId: '1' },
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether', chainId: '1' },
  { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave', chainId: '1' },
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap', chainId: '1' },
  { address: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink', chainId: '1' },
];

@Injectable()
export class TokenBalanceHistoryService {
  private generateMockSnapshots(timeRange: string, startValue: number): BalanceSnapshot[] {
    const now = Date.now();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const snapshots: BalanceSnapshot[] = [];
    let currentValue = startValue;

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const dailyChange = (Math.random() - 0.48) * 0.08;
      currentValue = currentValue * (1 + dailyChange);

      const prevValue = snapshots.length > 0 ? snapshots[snapshots.length - 1].balanceUsd : currentValue;
      const change24h = currentValue - prevValue;
      const changePercent24h = prevValue > 0 ? (change24h / prevValue) * 100 : 0;

      snapshots.push({
        timestamp,
        date: new Date(timestamp).toISOString().split('T')[0],
        balance: currentValue.toString(),
        balanceUsd: Math.round(currentValue * 100) / 100,
        change24h: Math.round(change24h * 100) / 100,
        changePercent24h: Math.round(changePercent24h * 100) / 100,
      });
    }

    return snapshots;
  }

  async getBalanceHistory(
    address: string,
    chainId?: string,
    tokenAddress?: string,
    timeRange: string = '30d',
  ) {
    const chains = chainId ? [chainId] : SUPPORTED_CHAINS.map(c => c.id);
    const tokens = tokenAddress 
      ? MOCK_TOKENS.filter(t => t.address.toLowerCase() === tokenAddress.toLowerCase())
      : MOCK_TOKENS;

    const result: Record<string, TokenBalance[]> = {};

    for (const chain of chains) {
      const chainTokens = tokens.filter(t => t.chainId === chain);
      if (chainTokens.length > 0) {
        result[chain] = chainTokens.map(token => {
          const balance = (Math.random() * 100).toFixed(4);
          const price = Math.random() * 2000 + 10;
          const balanceUsd = parseFloat(balance) * price;
          return {
            chainId: chain,
            tokenAddress: token.address,
            symbol: token.symbol,
            name: token.name,
            balance,
            balanceUsd: Math.round(balanceUsd * 100) / 100,
            price: Math.round(price * 100) / 100,
            change24h: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
          };
        });
      }
    }

    return {
      address,
      timeRange,
      snapshots: this.generateMockSnapshots(timeRange, 50000),
      balances: result,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getPortfolioSnapshots(
    address: string,
    chains?: string[],
    timeRange: string = '30d',
  ) {
    const chainList = chains && chains.length > 0 ? chains : SUPPORTED_CHAINS.map(c => c.id);
    
    const snapshots = this.generateMockSnapshots(timeRange, 75000);

    return {
      address,
      chains: chainList,
      timeRange,
      snapshots,
      totalValue: snapshots[snapshots.length - 1]?.balanceUsd || 0,
      highValue: Math.max(...snapshots.map(s => s.balanceUsd)),
      lowValue: Math.min(...snapshots.map(s => s.balanceUsd)),
      avgValue: snapshots.reduce((sum, s) => sum + s.balanceUsd, 0) / snapshots.length,
    };
  }

  async getBalanceChanges(
    address: string,
    minChange: number = 10,
    timeRange: string = '7d',
  ): Promise<{ address: string; changes: BalanceChange[] }> {
    const tokens = MOCK_TOKENS.slice(0, 8);
    const changes: BalanceChange[] = tokens.map((token, index) => {
      const changePercent = (Math.random() - 0.3) * 50;
      if (Math.abs(changePercent) < minChange) return null;

      const previousBalance = (Math.random() * 50 + 10).toFixed(4);
      const currentBalance = (parseFloat(previousBalance) * (1 + changePercent / 100)).toFixed(4);
      const price = Math.random() * 500 + 10;
      const changeUsd = (parseFloat(currentBalance) - parseFloat(previousBalance)) * price;

      return {
        tokenAddress: token.address,
        symbol: token.symbol,
        chainId: token.chainId,
        previousBalance,
        currentBalance,
        changePercent: Math.round(changePercent * 100) / 100,
        changeUsd: Math.round(changeUsd * 100) / 100,
        timestamp: Date.now() - index * 3600000,
      };
    }).filter(Boolean) as BalanceChange[];

    return { address, changes };
  }

  async getTopHolders(
    tokenAddress: string,
    chainId: string,
    date?: string,
  ): Promise<{ tokenAddress: string; chainId: string; date: string; holders: HolderInfo[] }> {
    const holders: HolderInfo[] = [];
    let totalBalance = 0;

    for (let i = 0; i < 20; i++) {
      const balance = (Math.random() * 1000 + 10).toFixed(4);
      const price = Math.random() * 500 + 10;
      const balanceUsd = parseFloat(balance) * price;
      totalBalance += balanceUsd;
      holders.push({
        address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance,
        balanceUsd: Math.round(balanceUsd * 100) / 100,
        percent: 0,
        rank: i + 1,
      });
    }

    holders.forEach(h => {
      h.percent = Math.round((h.balanceUsd / totalBalance) * 10000) / 100;
    });

    return {
      tokenAddress,
      chainId,
      date: date || new Date().toISOString().split('T')[0],
      holders: holders.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)),
    };
  }

  async getDistribution(
    tokenAddress: string,
    chainId: string,
  ): Promise<{ tokenAddress: string; chainId: string; distribution: DistributionBucket[] }> {
    const distribution: DistributionBucket[] = [
      { range: '0-100', count: Math.floor(Math.random() * 5000) + 3000, percent: 45, totalBalance: '0' },
      { range: '100-1K', count: Math.floor(Math.random() * 2000) + 1000, percent: 25, totalBalance: '0' },
      { range: '1K-10K', count: Math.floor(Math.random() * 500) + 200, percent: 15, totalBalance: '0' },
      { range: '10K-100K', count: Math.floor(Math.random() * 100) + 50, percent: 10, totalBalance: '0' },
      { range: '100K+', count: Math.floor(Math.random() * 20) + 5, percent: 5, totalBalance: '0' },
    ];

    return { tokenAddress, chainId, distribution };
  }

  async getStatistics(
    address: string,
    chainId?: string,
  ): Promise<{ address: string; statistics: Statistics }> {
    const statistics: Statistics = {
      totalBalanceUsd: Math.round(Math.random() * 100000 + 10000),
      totalTokens: Math.floor(Math.random() * 15) + 5,
      chains: SUPPORTED_CHAINS.slice(0, Math.floor(Math.random() * 4) + 2).map(c => c.id),
      avgHoldingDuration: Math.floor(Math.random() * 180) + 30,
      largestHolding: {
        chainId: '1',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: (Math.random() * 10 + 1).toFixed(4),
        balanceUsd: Math.round(Math.random() * 30000),
        price: 2000,
        change24h: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
      },
      mostVolatile: {
        chainId: '1',
        tokenAddress: MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)].address,
        symbol: 'UNI',
        name: 'Uniswap',
        balance: (Math.random() * 100).toFixed(2),
        balanceUsd: Math.round(Math.random() * 5000),
        price: 10,
        change24h: Math.round((Math.random() - 0.3) * 30 * 100) / 100,
      },
      recentGains: Math.floor(Math.random() * 5) + 1,
      recentLosses: Math.floor(Math.random() * 3),
    };

    return { address, statistics };
  }

  async getDashboard(
    address: string,
    chains?: string[],
  ): Promise<DashboardData> {
    const chainList = chains && chains.length > 0 ? chains : SUPPORTED_CHAINS.map(c => c.id);
    const snapshots = this.generateMockSnapshots('30d', 60000);
    const latestValue = snapshots[snapshots.length - 1]?.balanceUsd || 60000;
    const prevValue = snapshots[snapshots.length - 2]?.balanceUsd || latestValue;
    const change24h = latestValue - prevValue;
    const changePercent24h = prevValue > 0 ? (change24h / prevValue) * 100 : 0;

    const chainDistribution = chainList.map(chainId => ({
      chainId,
      value: Math.round(Math.random() * 20000),
      percent: Math.round(Math.random() * 40 + 10),
    }));

    const totalChainValue = chainDistribution.reduce((sum, c) => sum + c.value, 0);
    chainDistribution.forEach(c => {
      c.percent = Math.round((c.value / totalChainValue) * 100);
    });

    const tokenDistribution = MOCK_TOKENS.slice(0, 6).map(token => ({
      token: token.symbol,
      value: Math.round(Math.random() * 15000),
      percent: Math.round(Math.random() * 30 + 5),
    }));

    const totalTokenValue = tokenDistribution.reduce((sum, t) => sum + t.value, 0);
    tokenDistribution.forEach(t => {
      t.percent = Math.round((t.value / totalTokenValue) * 100);
    });

    const changes = await this.getBalanceChanges(address, 5, '7d');

    return {
      summary: {
        totalValue: latestValue,
        change24h: Math.round(change24h * 100) / 100,
        changePercent24h: Math.round(changePercent24h * 100) / 100,
        topChain: chainDistribution.sort((a, b) => b.value - a.value)[0]?.chainId || '1',
        topToken: tokenDistribution.sort((a, b) => b.value - a.value)[0]?.token || 'ETH',
      },
      portfolioSnapshots: snapshots,
      balanceChanges: changes.changes.slice(0, 5),
      chainDistribution,
      tokenDistribution,
    };
  }
}

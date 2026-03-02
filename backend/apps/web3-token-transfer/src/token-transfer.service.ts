import { Injectable } from '@nestjs/common';

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  timestamp: number;
  blockNumber: number;
  chainId: number;
  direction: 'in' | 'out';
}

export interface TransferStats {
  totalReceived: string;
  totalSent: string;
  netFlow: string;
  transactionCount: number;
  uniqueTokens: number;
  averageTransfer: string;
  largestTransfer: string;
  smallestTransfer: string;
}

export interface AddressTokenHoldings {
  address: string;
  chainId: number;
  holdings: {
    tokenAddress: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    valueUSD: number;
    percentage: number;
  }[];
  totalValueUSD: number;
  lastUpdated: number;
}

export interface TransferAnalysis {
  address: string;
  chainId: number;
  stats: TransferStats;
  transfers: TokenTransfer[];
  tokenBreakdown: {
    token: string;
    symbol: string;
    received: string;
    sent: string;
    count: number;
  }[];
  timeDistribution: {
    period: string;
    count: number;
    volume: string;
  }[];
  counterparties: {
    address: string;
    totalReceived: string;
    totalSent: string;
    transactionCount: number;
  }[];
  riskAssessment: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

// Popular tokens by chain
const POPULAR_TOKENS: Record<number, { address: string; symbol: string; name: string }[]> = {
  1: [
    { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin' },
    { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', symbol: 'AAVE', name: 'Aave Token' },
    { address: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink Token' },
    { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', symbol: 'MATIC', name: 'Matic Token' },
    { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap' },
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin' },
    { address: '0xd533a949740bb3306d119cc777fa900ba034cd52', symbol: 'CRV', name: 'Curve DAO Token' },
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', symbol: 'DAI', name: 'Dai Stablecoin' },
  ],
  137: [
    { address: '0x53e0bca35ec1bd2a9f0b605e0d8a2d1ae3e6fe2f', symbol: 'WMATIC', name: 'Wrapped Matic' },
    { address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', symbol: 'USDC', name: 'USD Coin (PoS)' },
    { address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', symbol: 'WBTC', name: 'Wrapped Bitcoin (PoS)' },
  ],
  42161: [
    { address: '0x82af49447d8a07e3bd95bd0d56f5c4159baab5be', symbol: 'ETH', name: 'Ethereum' },
    { address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol: 'USDC', name: 'USD Coin (Arbitrum)' },
    { address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  ],
};

// Mock whale/known addresses for demo
const KNOWN_ADDRESSES: Record<string, { label: string; type: string }> = {
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { label: 'Uniswap V2 Router', type: 'dex' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { label: 'Uniswap V3 Router', type: 'dex' },
  '0x3fC91A3afd70387fE2F7bA00d7b2a2A50d4a97e6': { label: 'Uniswap V3 Router 2', type: 'dex' },
  '0xa5E0829CaCEd8fFD9D1843eD1Dc0cDa0E0F3f98C': { label: 'SushiSwap Router', type: 'dex' },
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': { label: 'Polygon (MATIC)', type: 'token' },
};

@Injectable()
export class TokenTransferService {
  private watchedAddresses: Map<string, { label: string; addedAt: number }> = new Map();

  async analyzeAddress(address: string, chainId: number, tokenAddress?: string): Promise<TransferAnalysis> {
    const transfers = await this.getTransfers(address, chainId, tokenAddress, 100);
    const stats = await this.getTransferStats(address, chainId, tokenAddress);
    
    // Calculate token breakdown
    const tokenMap = new Map<string, { token: string; symbol: string; received: string; sent: string; count: number }>();
    
    for (const transfer of transfers) {
      if (!tokenMap.has(transfer.tokenAddress)) {
        tokenMap.set(transfer.tokenAddress, {
          token: transfer.tokenAddress,
          symbol: transfer.tokenSymbol,
          received: '0',
          sent: '0',
          count: 0,
        });
      }
      const entry = tokenMap.get(transfer.tokenAddress)!;
      entry.count++;
      if (transfer.direction === 'in') {
        entry.received = (BigInt(entry.received) + BigInt(transfer.value)).toString();
      } else {
        entry.sent = (BigInt(entry.sent) + BigInt(transfer.value)).toString();
      }
    }

    // Calculate time distribution (mock)
    const timeDistribution = [
      { period: '00-04', count: Math.floor(transfers.length * 0.1), volume: (BigInt(stats.totalReceived) / 10n).toString() },
      { period: '04-08', count: Math.floor(transfers.length * 0.15), volume: (BigInt(stats.totalReceived) / 7n).toString() },
      { period: '08-12', count: Math.floor(transfers.length * 0.25), volume: (BigInt(stats.totalReceived) / 4n).toString() },
      { period: '12-16', count: Math.floor(transfers.length * 0.2), volume: (BigInt(stats.totalReceived) / 5n).toString() },
      { period: '16-20', count: Math.floor(transfers.length * 0.2), volume: (BigInt(stats.totalReceived) / 5n).toString() },
      { period: '20-24', count: Math.floor(transfers.length * 0.1), volume: (BigInt(stats.totalReceived) / 10n).toString() },
    ];

    // Calculate counterparties
    const counterpartyMap = new Map<string, { address: string; totalReceived: string; totalSent: string; transactionCount: number }>();
    
    for (const transfer of transfers) {
      const counterparty = transfer.direction === 'in' ? transfer.from : transfer.to;
      
      if (!counterpartyMap.has(counterparty)) {
        counterpartyMap.set(counterparty, {
          address: counterparty,
          totalReceived: '0',
          totalSent: '0',
          transactionCount: 0,
        });
      }
      const entry = counterpartyMap.get(counterparty)!;
      entry.transactionCount++;
      if (transfer.direction === 'in') {
        entry.totalReceived = (BigInt(entry.totalReceived) + BigInt(transfer.value)).toString();
      } else {
        entry.totalSent = (BigInt(entry.totalSent) + BigInt(transfer.value)).toString();
      }
    }

    // Risk assessment
    const riskFactors: string[] = [];
    let riskScore = 0;

    if (transfers.length > 1000) {
      riskFactors.push('Very high transaction volume');
      riskScore += 20;
    }
    if (Number(stats.largestTransfer) > BigInt(1e24)) { // > 10M
      riskFactors.push('Occasional very large transfers detected');
      riskScore += 15;
    }
    if (tokenMap.size > 20) {
      riskFactors.push('High token diversity');
      riskScore += 10;
    }

    const riskLevel = riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : 'low';

    return {
      address,
      chainId,
      stats,
      transfers: transfers.slice(0, 50),
      tokenBreakdown: Array.from(tokenMap.values()),
      timeDistribution,
      counterparties: Array.from(counterpartyMap.values())
        .sort((a, b) => Number(b.transactionCount) - Number(a.transactionCount))
        .slice(0, 10),
      riskAssessment: {
        score: Math.min(riskScore, 100),
        level: riskLevel,
        factors: riskFactors,
      },
    };
  }

  async getTransfers(
    address: string,
    chainId: number,
    tokenAddress?: string,
    limit: number = 50,
    direction?: string,
  ): Promise<TokenTransfer[]> {
    // Generate mock transfer data
    const transfers: TokenTransfer[] = [];
    const tokens = POPULAR_TOKENS[chainId] || POPULAR_TOKENS[1];
    const now = Date.now();
    
    for (let i = 0; i < limit; i++) {
      const isIncoming = Math.random() > 0.5;
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const value = (Math.random() * 10000 * 1e18).toFixed(0);
      const timestamp = now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      
      transfers.push({
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        from: isIncoming ? `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` : address,
        to: isIncoming ? address : `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        value,
        tokenAddress: token.address,
        tokenSymbol: token.symbol,
        tokenDecimals: 18,
        timestamp,
        blockNumber: 19000000 + i * 1000,
        chainId,
        direction: isIncoming ? 'in' : 'out',
      });
    }

    // Sort by timestamp descending
    transfers.sort((a, b) => b.timestamp - a.timestamp);

    // Filter by direction if specified
    if (direction === 'in') {
      return transfers.filter(t => t.direction === 'in');
    } else if (direction === 'out') {
      return transfers.filter(t => t.direction === 'out');
    }

    return transfers;
  }

  async getTransferStats(address: string, chainId: number, tokenAddress?: string): Promise<TransferStats> {
    const transfers = await this.getTransfers(address, chainId, tokenAddress, 100);
    
    let totalReceived = 0n;
    let totalSent = 0n;
    const uniqueTokens = new Set<string>();

    for (const transfer of transfers) {
      uniqueTokens.add(transfer.tokenSymbol);
      if (transfer.direction === 'in') {
        totalReceived += BigInt(transfer.value);
      } else {
        totalSent += BigInt(transfer.value);
      }
    }

    const values = transfers.map(t => BigInt(t.value));
    const largestTransfer = values.length > 0 ? values.reduce((a, b) => a > b ? a : b, 0n).toString() : '0';
    const smallestTransfer = values.length > 0 ? values.reduce((a, b) => a < b ? a : b, 0n).toString() : '0';
    const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0n) / BigInt(values.length) : 0n;

    return {
      totalReceived: totalReceived.toString(),
      totalSent: totalSent.toString(),
      netFlow: (totalReceived - totalSent).toString(),
      transactionCount: transfers.length,
      uniqueTokens: uniqueTokens.size,
      averageTransfer: avgValue.toString(),
      largestTransfer,
      smallestTransfer,
    };
  }

  async getTokenHoldings(address: string, chainId: number): Promise<AddressTokenHoldings> {
    const tokens = POPULAR_TOKENS[chainId] || POPULAR_TOKENS[1];
    const holdings = tokens.map(token => ({
      tokenAddress: token.address,
      symbol: token.symbol,
      name: token.name,
      balance: (Math.random() * 10000 * 1e18).toFixed(0),
      decimals: 18,
      valueUSD: Math.random() * 50000,
      percentage: 0,
    }));

    // Calculate percentages
    const totalValue = holdings.reduce((sum, h) => sum + h.valueUSD, 0);
    holdings.forEach(h => {
      h.percentage = (h.valueUSD / totalValue) * 100;
    });

    return {
      address,
      chainId,
      holdings: holdings.sort((a, b) => b.valueUSD - a.valueUSD),
      totalValueUSD: totalValue,
      lastUpdated: Date.now(),
    };
  }

  async getLargeTransfers(chainId: number, minValue: number, limit: number): Promise<TokenTransfer[]> {
    // Generate large transfers across the network
    const transfers: TokenTransfer[] = [];
    const tokens = POPULAR_TOKENS[chainId] || POPULAR_TOKENS[1];
    const now = Date.now();

    for (let i = 0; i < limit; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const value = (minValue + Math.random() * minValue * 10 * 1e18).toFixed(0);
      const timestamp = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);

      transfers.push({
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        from: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        to: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        value,
        tokenAddress: token.address,
        tokenSymbol: token.symbol,
        tokenDecimals: 18,
        timestamp,
        blockNumber: 19000000 + i * 1000,
        chainId,
        direction: Math.random() > 0.5 ? 'in' : 'out',
      });
    }

    return transfers.sort((a, b) => Number(b.value) - Number(a.value));
  }

  async getTokenHolders(tokenAddress: string, chainId: number, limit: number = 50): Promise<any> {
    const holders = [];
    for (let i = 0; i < limit; i++) {
      holders.push({
        rank: i + 1,
        address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: (Math.random() * 1000000 * 1e18).toFixed(0),
        percentage: (Math.random() * 10).toFixed(2),
      });
    }
    return { tokenAddress, chainId, holders };
  }

  async getPopularTokens(chainId: number): Promise<any[]> {
    return POPULAR_TOKENS[chainId] || POPULAR_TOKENS[1];
  }

  watchAddress(address: string, label?: string): { success: boolean; address: string; label: string } {
    this.watchedAddresses.set(address.toLowerCase(), {
      label: label || 'Watched',
      addedAt: Date.now(),
    });
    return { success: true, address, label: label || 'Watched' };
  }

  getWatchedAddresses(): { address: string; label: string; addedAt: number }[] {
    return Array.from(this.watchedAddresses.entries()).map(([address, data]) => ({
      address,
      ...data,
    }));
  }

  async getTopTransferrers(chainId: number, timeRange: string, limit: number): Promise<any[]> {
    const transferrers = [];
    for (let i = 0; i < limit; i++) {
      const isExchange = Math.random() > 0.5;
      transferrers.push({
        rank: i + 1,
        address: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        label: isExchange ? ['Binance', 'Coinbase', 'Kraken', 'Bitfinex'][Math.floor(Math.random() * 4)] : 'Unknown',
        volume: (Math.random() * 1000000).toFixed(2),
        txCount: Math.floor(Math.random() * 5000) + 100,
        type: isExchange ? 'exchange' : 'whale',
      });
    }
    return transferrers.sort((a, b) => Number(b.volume) - Number(a.volume));
  }
}

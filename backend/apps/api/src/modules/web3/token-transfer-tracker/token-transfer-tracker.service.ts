import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface Transfer {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  token: string;
  tokenSymbol: string;
  value: string;
  valueUsd: number;
  chain: string;
}

interface TransferStats {
  totalTransfers: number;
  totalVolume: number;
  totalVolumeUsd: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  avgTransferUsd: number;
}

interface ChainStats {
  chain: string;
  transfers: number;
  volumeUsd: number;
}

@Injectable()
export class TokenTransferTrackerService {
  private readonly chains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'base',
    'avalanche',
  ];

  private readonly popularTokens: Record<string, string[]> = {
    ethereum: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'],
    polygon: ['0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'],
    arbitrum: ['0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', '0xDA10009CbBd8eb18Ba9EAFD1AcCC04BC7d3BCra0'],
    optimism: ['0x4200000000000000000000000000000000000006', '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', '0x0b2C639c533813f4Aa9D7837CAf62653dDaFf8Cc'],
    bsc: ['0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', '0x55d398326f99059fF775485246999027B3197955'],
    base: ['0x4200000000000000000000000000000000000006', '0x833589fCD6eDb6E08f4c7c32D4d71bBD7AD4dBCE', '0x4ed4e862860bed51a9570b96d89af5e1b0efefed'],
    avalanche: ['0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', '0xB97EF9Ef8734C71904D8002F8b6Bc99Dd5AdC7E7', '0xd24c2ad096755B6E701Ae8C91A51AE53F05d5ce4'],
  };

  constructor(private readonly httpService: HttpService) {}

  async getTransfers(params: {
    address?: string;
    chain?: string;
    token?: string;
    startBlock?: number;
    endBlock?: number;
    page?: number;
    limit?: number;
  }): Promise<{ transfers: Transfer[]; total: number; page: number; limit: number }> {
    const { address, chain, token, startBlock, endBlock, page = 1, limit = 50 } = params;
    
    // Generate mock transfer data based on parameters
    const transfers: Transfer[] = [];
    const chainsToQuery = chain ? [chain] : this.chains;
    const tokens = token ? [token] : (chain ? this.popularTokens[chain] || [] : Object.values(this.popularTokens).flat());
    
    const total = Math.floor(Math.random() * 500) + 100;
    const numTransfers = Math.min(limit, total - (page - 1) * limit);
    
    for (let i = 0; i < numTransfers; i++) {
      const randomChain = chainsToQuery[Math.floor(Math.random() * chainsToQuery.length)];
      const randomToken = tokens[Math.floor(Math.random() * Math.min(tokens.length, 5))];
      const timestamp = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
      const value = Math.random() * 10000;
      
      transfers.push({
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        blockNumber: 18000000 + Math.floor(Math.random() * 1000000),
        timestamp,
        from: address || `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        to: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        token: randomToken,
        tokenSymbol: this.getTokenSymbol(randomChain, randomToken),
        value: value.toFixed(6),
        valueUsd: value * (Math.random() * 2 + 0.5),
        chain: randomChain,
      });
    }
    
    return {
      transfers: transfers.sort((a, b) => b.timestamp - a.timestamp),
      total,
      page,
      limit,
    };
  }

  async getTransferStats(params: {
    address?: string;
    chain?: string;
    token?: string;
    period?: string;
  }): Promise<{ stats: TransferStats; chainStats: ChainStats[]; period: string }> {
    const { address, chain, token, period = '30d' } = params;
    
    const totalTransfers = Math.floor(Math.random() * 1000) + 100;
    const totalVolume = Math.random() * 50000;
    const uniqueSenders = Math.floor(Math.random() * 200) + 50;
    const uniqueReceivers = Math.floor(Math.random() * 200) + 50;
    
    const stats: TransferStats = {
      totalTransfers,
      totalVolume,
      totalVolumeUsd: totalVolume * 1800,
      uniqueSenders,
      uniqueReceivers,
      avgTransferUsd: (totalVolume * 1800) / totalTransfers,
    };
    
    const chainStats: ChainStats[] = this.chains.map((c) => ({
      chain: c,
      transfers: Math.floor(Math.random() * 200) + 20,
      volumeUsd: Math.random() * 50000 + 5000,
    }));
    
    return { stats, chainStats, period };
  }

  async getTransferHistory(params: {
    address?: string;
    chain?: string;
    token?: string;
    period?: string;
  }): Promise<{ data: { date: string; transfers: number; volumeUsd: number }[]; period: string }> {
    const { period = '30d' } = params;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    
    const data = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString().split('T')[0],
        transfers: Math.floor(Math.random() * 50) + 5,
        volumeUsd: Math.random() * 50000 + 10000,
      });
    }
    
    return { data, period };
  }

  async getTopTokens(params: {
    chain?: string;
    period?: string;
    limit?: number;
  }): Promise<{ tokens: { token: string; symbol: string; transfers: number; volumeUsd: number; chain: string }[]; period: string }> {
    const { chain, period = '30d', limit = 20 } = params;
    
    const tokens = [];
    const tokenList = chain ? this.popularTokens[chain] || [] : Object.values(this.popularTokens).flat();
    
    for (let i = 0; i < Math.min(limit, tokenList.length); i++) {
      tokens.push({
        token: tokenList[i],
        symbol: this.getTokenSymbol(chain || 'ethereum', tokenList[i]),
        transfers: Math.floor(Math.random() * 500) + 50,
        volumeUsd: Math.random() * 100000 + 10000,
        chain: chain || this.chains[i % this.chains.length],
      });
    }
    
    return { tokens: tokens.sort((a, b) => b.volumeUsd - a.volumeUsd), period };
  }

  async getAddressActivity(params: {
    address: string;
    chain?: string;
  }): Promise<{ address: string; totalReceived: number; totalSent: number; firstSeen: number; lastSeen: number; chainActivity: Record<string, { received: number; sent: number }> }> {
    const { address, chain } = params;
    
    const chainActivity: Record<string, { received: number; sent: number }> = {};
    const chains = chain ? [chain] : this.chains;
    
    chains.forEach((c) => {
      chainActivity[c] = {
        received: Math.floor(Math.random() * 100) + 10,
        sent: Math.floor(Math.random() * 100) + 10,
      };
    });
    
    return {
      address,
      totalReceived: Math.floor(Math.random() * 1000000) + 100000,
      totalSent: Math.floor(Math.random() * 1000000) + 100000,
      firstSeen: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastSeen: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      chainActivity,
    };
  }

  private getTokenSymbol(chain: string, token: string): string {
    const symbols: Record<string, Record<string, string>> = {
      ethereum: {
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'WBTC',
      },
      polygon: {
        '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad39': 'MATIC',
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'USDC',
        '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6': 'WBTC',
      },
      arbitrum: {
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': 'WETH',
        '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': 'USDC',
      },
      optimism: {
        '0x4200000000000000000000000000000000000006': 'ETH',
        '0x7F5c764cBc14f9669B88837ca1490cCa17c31607': 'USDC',
      },
      bsc: {
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 'BNB',
        '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': 'BUSD',
        '0x55d398326f99059fF775485246999027B3197955': 'USDT',
      },
      base: {
        '0x4200000000000000000000000000000000000006': 'ETH',
        '0x833589fCD6eDb6E08f4c7c32D4d71bBD7AD4dBCE': 'USDC',
      },
      avalanche: {
        '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7': 'AVAX',
        '0xB97EF9Ef8734C71904D8002F8b6Bc99Dd5AdC7E7': 'USDC',
      },
    };
    
    return symbols[chain]?.[token] || 'TOKEN';
  }

  getSupportedChains(): string[] {
    return this.chains;
  }
}

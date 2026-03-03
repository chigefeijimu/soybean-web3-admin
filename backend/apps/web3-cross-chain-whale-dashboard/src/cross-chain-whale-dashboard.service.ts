import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface WhaleTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  token: string;
  chain: string;
  type: 'transfer' | 'swap' | 'bridge' | 'nft' | 'defi';
}

interface WhaleAddress {
  address: string;
  label: string;
  type: 'exchange' | 'dao' | 'defi' | 'whale' | 'team' | 'unknown';
  totalVolume: number;
  lastActive: number;
  txCount: number;
}

interface ChainStats {
  chain: string;
  totalVolume: number;
  txCount: number;
  avgTransactionSize: number;
  whaleCount: number;
}

@Injectable()
export class CrossChainWhaleDashboardService {
  private readonly logger = new Logger(CrossChainWhaleDashboardService.name);
  
  // Known whale addresses database
  private knownWhales: WhaleAddress[] = [
    { address: '0x8ba1f109551bd432803012645ac136ddd64dba72', label: 'Binance Hot Wallet', type: 'exchange', totalVolume: 15234567890, lastActive: Date.now() - 300000, txCount: 45231 },
    { address: '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503', label: 'Vitalik Buterin', type: 'whale', totalVolume: 2345678901, lastActive: Date.now() - 86400000, txCount: 1234 },
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Vitalik (ENS)', type: 'whale', totalVolume: 1890123456, lastActive: Date.now() - 172800000, txCount: 987 },
    { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', label: 'Coinbase Cold', type: 'exchange', totalVolume: 8923456789, lastActive: Date.now() - 600000, txCount: 23456 },
    { address: '0x5f3f7331c9197e18db715a3e3b0a19e4ce3b3a25', label: 'Aave Treasury', type: 'dao', totalVolume: 567890123, lastActive: Date.now() - 7200000, txCount: 456 },
    { address: '0x3ddfa8ec3052539205b6fdec69a8d657c5e2b47d', label: 'Uniswap Foundation', type: 'dao', totalVolume: 345678901, lastActive: Date.now() - 14400000, txCount: 234 },
    { address: '0xd533a949740bb3306d119cc777fa900ba034cd52', label: 'Curve DAO', type: 'dao', totalVolume: 456789012, lastActive: Date.now() - 3600000, txCount: 567 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', label: 'Uniswap Labs', type: 'team', totalVolume: 234567890, lastActive: Date.now() - 1800000, txCount: 345 },
  ];

  // Supported chains
  private supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche', 
    'solana', 'zksync', 'starknet', 'linea', 'scroll', 'mantle'
  ];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get cross-chain whale activity overview
   */
  async getWhaleActivityOverview(): Promise<{
    totalVolume24h: number;
    totalTransactions24h: number;
    avgTransactionSize: number;
    activeWhales: number;
    topChains: ChainStats[];
    recentLargeTransactions: WhaleTransaction[];
  }> {
    const recentLargeTransactions = await this.getRecentLargeTransactions(10);
    const topChains = await this.getChainStats();
    
    const totalVolume24h = recentLargeTransactions.reduce((sum, tx) => sum + tx.valueUsd, 0);
    const totalTransactions24h = recentLargeTransactions.length;
    
    return {
      totalVolume24h,
      totalTransactions24h,
      avgTransactionSize: totalTransactions24h > 0 ? totalVolume24h / totalTransactions24h : 0,
      activeWhales: this.knownWhales.filter(w => Date.now() - w.lastActive < 86400000).length,
      topChains,
      recentLargeTransactions,
    };
  }

  /**
   * Get recent large transactions across chains
   */
  async getRecentLargeTransactions(limit: number = 20): Promise<WhaleTransaction[]> {
    // Generate realistic whale transactions
    const transactions: WhaleTransaction[] = [];
    const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'WETH', 'BNB', 'AVAX', 'MATIC'];
    const types: WhaleTransaction['type'][] = ['transfer', 'swap', 'bridge', 'defi'];
    
    for (let i = 0; i < limit; i++) {
      const chain = this.supportedChains[Math.floor(Math.random() * 7)];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const value = Math.random() * 5000 + 100; // 100-5100 ETH or equivalent
      const valueUsd = value * (token === 'ETH' ? 2450 : token === 'WBTC' ? 62000 : token.includes('USD') ? value : 1800);
      
      transactions.push({
        hash: `0x${Math.random().toString(16).substring(2, 66).padEnd(64, '0')}`,
        blockNumber: 19000000 + Math.floor(Math.random() * 100000),
        timestamp: Date.now() - Math.floor(Math.random() * 86400000),
        from: this.knownWhales[Math.floor(Math.random() * this.knownWhales.length)].address,
        to: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`,
        value,
        valueUsd,
        token,
        chain,
        type,
      });
    }
    
    // Sort by value USD descending
    return transactions.sort((a, b) => b.valueUsd - a.valueUsd).slice(0, limit);
  }

  /**
   * Get whale activity by chain
   */
  async getWhaleActivityByChain(chain: string): Promise<{
    chain: string;
    volume24h: number;
    transactionCount: number;
    avgTransactionSize: number;
    topWhales: WhaleAddress[];
    recentTransactions: WhaleTransaction[];
  }> {
    const recentTxs = await this.getRecentLargeTransactions(50);
    const chainTxs = recentTxs.filter(tx => tx.chain.toLowerCase() === chain.toLowerCase());
    
    const volume24h = chainTxs.reduce((sum, tx) => sum + tx.valueUsd, 0);
    
    return {
      chain,
      volume24h,
      transactionCount: chainTxs.length,
      avgTransactionSize: chainTxs.length > 0 ? volume24h / chainTxs.length : 0,
      topWhales: this.knownWhales.slice(0, 5),
      recentTransactions: chainTxs.slice(0, 10),
    };
  }

  /**
   * Get chain statistics
   */
  async getChainStats(): Promise<ChainStats[]> {
    const stats: ChainStats[] = [];
    
    for (const chain of this.supportedChains.slice(0, 7)) {
      const volume = Math.random() * 5000000000 + 500000000;
      stats.push({
        chain,
        totalVolume: volume,
        txCount: Math.floor(Math.random() * 5000) + 500,
        avgTransactionSize: volume / 3000,
        whaleCount: Math.floor(Math.random() * 50) + 10,
      });
    }
    
    return stats.sort((a, b) => b.totalVolume - a.totalVolume);
  }

  /**
   * Get known whale addresses
   */
  async getKnownWhales(type?: string): Promise<WhaleAddress[]> {
    if (type) {
      return this.knownWhales.filter(w => w.type === type);
    }
    return this.knownWhales;
  }

  /**
   * Get whale details by address
   */
  async getWhaleDetails(address: string): Promise<WhaleAddress | null> {
    return this.knownWhales.find(w => w.address.toLowerCase() === address.toLowerCase()) || null;
  }

  /**
   * Search whales by label or address
   */
  async searchWhales(query: string): Promise<WhaleAddress[]> {
    const lowerQuery = query.toLowerCase();
    return this.knownWhales.filter(
      w => w.address.toLowerCase().includes(lowerQuery) || 
           w.label.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get whale alerts configuration
   */
  async getAlertConfigs(): Promise<any[]> {
    return [
      { id: '1', name: 'Large Transfer Alert', threshold: 100000, enabled: true, chains: ['ethereum', 'polygon'] },
      { id: '2', name: 'Exchange Outflow', threshold: 500000, enabled: true, chains: ['ethereum'] },
      { id: '3', name: 'Bridge Large Amount', threshold: 250000, enabled: true, chains: ['arbitrum', 'optimism'] },
    ];
  }

  /**
   * Create alert configuration
   */
  async createAlertConfig(config: {
    name: string;
    threshold: number;
    chains: string[];
    address?: string;
  }): Promise<any> {
    return {
      id: Math.random().toString(36).substring(7),
      ...config,
      enabled: true,
      createdAt: Date.now(),
    };
  }

  /**
   * Get whale activity timeline (hourly breakdown)
   */
  async getWhaleActivityTimeline(hours: number = 24): Promise<{
    labels: string[];
    volumes: number[];
    transactionCounts: number[];
  }> {
    const labels: string[] = [];
    const volumes: number[] = [];
    const transactionCounts: number[] = [];
    
    const now = Date.now();
    const hourMs = 3600000;
    
    for (let i = hours - 1; i >= 0; i--) {
      const hour = new Date(now - i * hourMs);
      labels.push(hour.getHours().toString().padStart(2, '0') + ':00');
      
      // Generate realistic data
      const baseVolume = 50000000 + Math.random() * 100000000;
      const hourFactor = hour.getHours() >= 9 && hour.getHours() <= 18 ? 1.5 : 0.8;
      volumes.push(baseVolume * hourFactor);
      transactionCounts.push(Math.floor(Math.random() * 200) + 50);
    }
    
    return { labels, volumes, transactionCounts };
  }

  /**
   * Get cross-chain flow analysis
   */
  async getCrossChainFlow(): Promise<{
    fromChain: string;
    toChain: string;
    volume: number;
    transactions: number;
  }[]> {
    const flows = [];
    const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc'];
    
    for (let i = 0; i < chains.length; i++) {
      for (let j = 0; j < chains.length; j++) {
        if (i !== j && Math.random() > 0.6) {
          flows.push({
            fromChain: chains[i],
            toChain: chains[j],
            volume: Math.random() * 50000000 + 1000000,
            transactions: Math.floor(Math.random() * 500) + 50,
          });
        }
      }
    }
    
    return flows.sort((a, b) => b.volume - a.volume).slice(0, 15);
  }

  /**
   * Get whale leaderboard
   */
  async getWhaleLeaderboard(limit: number = 10): Promise<{
    rank: number;
    address: string;
    label: string;
    type: string;
    volume24h: number;
    txCount24h: number;
  }[]> {
    const leaderboard = this.knownWhales.map((whale, index) => ({
      rank: index + 1,
      address: whale.address,
      label: whale.label,
      type: whale.type,
      volume24h: whale.totalVolume * (0.1 + Math.random() * 0.2),
      txCount24h: Math.floor(Math.random() * 50) + 10,
    }));
    
    return leaderboard.slice(0, limit);
  }
}

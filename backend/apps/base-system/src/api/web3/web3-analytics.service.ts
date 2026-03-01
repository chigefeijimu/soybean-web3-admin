import { Injectable } from '@nestjs/common';

interface NetworkStats {
  chain: string;
  gasPrice: string;
  gasPriceGwei: string;
  blockNumber: number;
  blockTime: number;
  activeAddresses: number;
  tps: number;
  totalTransactions: number;
  marketCap: string;
  tvl: string;
  lastUpdated: string;
}

interface LargeTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueUsd: number;
  timestamp: number;
  blockNumber: number;
  token?: string;
}

interface TokenStats {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  transfers24h: number;
}

interface GasHistoryPoint {
  timestamp: number;
  avgGasPrice: string;
  avgGasPriceGwei: number;
  transactionCount: number;
}

interface BlockStats {
  blockNumber: number;
  timestamp: number;
  gasUsed: number;
  gasLimit: number;
  gasUtilization: number;
  transactions: number;
  miner: string;
  difficulty: string;
}

@Injectable()
export class Web3AnalyticsService {
  private readonly mockTokens: Record<string, TokenStats[]> = {
    ethereum: [
      { symbol: 'ETH', name: 'Ethereum', price: 2456.78, priceChange24h: 2.34, volume24h: 12500000000, marketCap: 295000000000, holders: 1850000, transfers24h: 1250000 },
      { symbol: 'USDT', name: 'Tether', price: 1.0, priceChange24h: 0.01, volume24h: 45000000000, marketCap: 95000000000, holders: 5200000, transfers24h: 8500000 },
      { symbol: 'USDC', name: 'USD Coin', price: 1.0, priceChange24h: -0.02, volume24h: 28000000000, marketCap: 42000000000, holders: 4100000, transfers24h: 6200000 },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', price: 67845.32, priceChange24h: 1.85, volume24h: 890000000, marketCap: 12000000000, holders: 185000, transfers24h: 45000 },
      { symbol: 'LINK', name: 'Chainlink', price: 18.45, priceChange24h: 5.67, volume24h: 650000000, marketCap: 11000000000, holders: 950000, transfers24h: 380000 },
    ],
    polygon: [
      { symbol: 'MATIC', name: 'Polygon', price: 0.89, priceChange24h: 1.23, volume24h: 350000000, marketCap: 8200000000, holders: 2100000, transfers24h: 1800000 },
      { symbol: 'USDT', name: 'Tether', price: 1.0, priceChange24h: 0.01, volume24h: 1800000000, marketCap: 95000000000, holders: 850000, transfers24h: 2500000 },
    ],
    bsc: [
      { symbol: 'BNB', name: 'BNB', price: 312.45, priceChange24h: -0.85, volume24h: 1500000000, marketCap: 48000000000, holders: 3200000, transfers24h: 4500000 },
      { symbol: 'CAKE', name: 'PancakeSwap', price: 2.85, priceChange24h: 3.45, volume24h: 180000000, marketCap: 1100000000, holders: 850000, transfers24h: 280000 },
    ],
  };

  async getNetworkStats(chain: string): Promise<NetworkStats> {
    const baseStats = {
      ethereum: { gasPrice: '35000000000', blockTime: 12, activeAddresses: 520000, tps: 15.5, totalTransactions: 1850000000, marketCap: '295B', tvl: '52B' },
      polygon: { gasPrice: '85000000000', blockTime: 2.1, activeAddresses: 280000, tps: 65, totalTransactions: 520000000, marketCap: '8.2B', tvl: '1.2B' },
      bsc: { gasPrice: '5000000000', blockTime: 3, activeAddresses: 350000, tps: 125, totalTransactions: 420000000, marketCap: '48B', tvl: '4.5B' },
      arbitrum: { gasPrice: '120000000', blockTime: 0.25, activeAddresses: 180000, tps: 250, totalTransactions: 85000000, marketCap: '3.2B', tvl: '2.8B' },
      optimism: { gasPrice: '80000000', blockTime: 2, activeAddresses: 150000, tps: 85, totalTransactions: 68000000, marketCap: '2.8B', tvl: '1.9B' },
    };

    const chainStats = baseStats[chain] || baseStats.ethereum;
    const blockNumber = 19000000 + Math.floor(Math.random() * 10000);

    return {
      chain,
      gasPrice: chainStats.gasPrice,
      gasPriceGwei: (parseInt(chainStats.gasPrice) / 1e9).toFixed(2),
      blockNumber,
      blockTime: chainStats.blockTime,
      activeAddresses: chainStats.activeAddresses + Math.floor(Math.random() * 10000),
      tps: chainStats.tps + Math.random() * 5,
      totalTransactions: chainStats.totalTransactions + Math.floor(Math.random() * 100000),
      marketCap: chainStats.marketCap,
      tvl: chainStats.tvl,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getLargeTransactions(chain: string, minValue: number, limit: number): Promise<LargeTransaction[]> {
    const transactions: LargeTransaction[] = [];
    const now = Date.now();

    const addresses = [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB4',
      '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
      '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    ];

    for (let i = 0; i < limit; i++) {
      const value = minValue + Math.random() * minValue * 10;
      transactions.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: addresses[Math.floor(Math.random() * addresses.length)],
        to: addresses[Math.floor(Math.random() * addresses.length)],
        value: value.toFixed(8),
        valueUsd: value * (chain === 'ethereum' ? 2456 : chain === 'polygon' ? 0.89 : 312),
        timestamp: now - Math.floor(Math.random() * 3600000),
        blockNumber: 19000000 + Math.floor(Math.random() * 1000),
        token: chain === 'ethereum' ? 'ETH' : undefined,
      });
    }

    return transactions.sort((a, b) => b.valueUsd - a.valueUsd);
  }

  async getPopularTokens(chain: string): Promise<TokenStats[]> {
    return this.mockTokens[chain] || this.mockTokens.ethereum;
  }

  async getGasHistory(chain: string, days: number): Promise<GasHistoryPoint[]> {
    const history: GasHistoryPoint[] = [];
    const now = Date.now();
    const baseGas = chain === 'ethereum' ? 35 : chain === 'polygon' ? 85 : 5;

    for (let i = days * 24; i >= 0; i--) {
      const timestamp = now - i * 3600000;
      const hourOfDay = new Date(timestamp).getHours();
      const multiplier = hourOfDay >= 9 && hourOfDay <= 18 ? 1.5 : 0.8;
      const gasGwei = baseGas * multiplier * (0.8 + Math.random() * 0.4);

      history.push({
        timestamp,
        avgGasPrice: Math.floor(gasGwei * 1e9).toString(),
        avgGasPriceGwei: gasGwei,
        transactionCount: Math.floor(50000 + Math.random() * 100000),
      });
    }

    return history;
  }

  async getBlockStats(chain: string): Promise<BlockStats> {
    const blockNumber = 19000000 + Math.floor(Math.random() * 100);
    const gasLimit = chain === 'ethereum' ? 30000000 : chain === 'polygon' ? 20000000 : 30000000;
    const gasUsed = Math.floor(gasLimit * (0.4 + Math.random() * 0.5));

    return {
      blockNumber,
      timestamp: Date.now(),
      gasUsed,
      gasLimit,
      gasUtilization: (gasUsed / gasLimit) * 100,
      transactions: Math.floor(100 + Math.random() * 200),
      miner: '0x' + Math.random().toString(16).substr(2, 40),
      difficulty: (15 * 1e15).toString(),
    };
  }

  async getWhaleActivity(chain: string, threshold: number): Promise<LargeTransaction[]> {
    return this.getLargeTransactions(chain, threshold, 10);
  }
}

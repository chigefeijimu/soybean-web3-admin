import { Injectable } from '@nestjs/common';

export interface NetworkStatus {
  chainId: number;
  chainName: string;
  blockNumber: number;
  gasPrice: number;
  tps: number;
  avgBlockTime: number;
  pendingTxCount: number;
  networkHealth: 'healthy' | 'congested' | 'degraded';
}

export interface LargeTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  timestamp: number;
  blockNumber: number;
  gasPrice: number;
  token?: string;
}

export interface PopularToken {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  transactions24h: number;
}

export interface ActiveAddress {
  address: string;
  label: string;
  type: 'exchange' | 'whale' | 'defi' | 'dao' | 'contract';
  txCount24h: number;
  volume24h: number;
}

export interface NetworkStats {
  totalValueLocked: number;
  totalTransactions24h: number;
  uniqueAddresses: number;
  avgGasPrice: number;
  newTokens24h: number;
  newContracts24h: number;
}

export interface ChainData {
  chainId: number;
  name: string;
  tvl: number;
  tx24h: number;
  gasPrice: number;
  activeAddresses: number;
  health: number;
}

@Injectable()
export class DataVizService {
  private readonly mockExchanges = [
    'Binance',
    'Coinbase',
    'Kraken',
    'Gemini',
    'Bitfinex',
    'Okx',
    'Bybit',
    'KuCoin'
  ];

  private readonly mockWhales = [
    '0x whale001',
    '0x whale002',
    '0x whale003',
    '0x DeFi whale',
    '0x NFT collector'
  ];

  private readonly popularTokens = [
    { symbol: 'ETH', name: 'Ethereum', basePrice: 2850 },
    { symbol: 'BTC', name: 'Bitcoin', basePrice: 65000 },
    { symbol: 'USDC', name: 'USD Coin', basePrice: 1 },
    { symbol: 'USDT', name: 'Tether', basePrice: 1 },
    { symbol: 'BNB', name: 'BNB', basePrice: 580 },
    { symbol: 'SOL', name: 'Solana', basePrice: 145 },
    { symbol: 'XRP', name: 'XRP', basePrice: 0.62 },
    { symbol: 'ADA', name: 'Cardano', basePrice: 0.45 },
    { symbol: 'AVAX', name: 'Avalanche', basePrice: 38 },
    { symbol: 'DOT', name: 'Polkadot', basePrice: 7.2 }
  ];

  private readonly chains: ChainData[] = [
    { chainId: 1, name: 'Ethereum', tvl: 180000000000, tx24h: 1200000, gasPrice: 25, activeAddresses: 450000, health: 98 },
    { chainId: 137, name: 'Polygon', tvl: 1200000000, tx24h: 3000000, gasPrice: 45, activeAddresses: 280000, health: 99 },
    { chainId: 42161, name: 'Arbitrum', tvl: 2500000000, tx24h: 800000, gasPrice: 0.15, activeAddresses: 150000, health: 97 },
    { chainId: 10, name: 'Optimism', tvl: 1200000000, tx24h: 500000, gasPrice: 0.02, activeAddresses: 80000, health: 96 },
    { chainId: 56, name: 'BSC', tvl: 800000000, tx24h: 5000000, gasPrice: 3, activeAddresses: 600000, health: 99 },
    { chainId: 8453, name: 'Base', tvl: 400000000, tx24h: 400000, gasPrice: 0.001, activeAddresses: 120000, health: 99 }
  ];

  private generateHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 40; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  async getNetworkStatus(chainId: number = 1): Promise<NetworkStatus> {
    const gasPrice = Math.random() * 50 + 10;
    const health: NetworkStatus['networkHealth'] = gasPrice > 40 ? 'congested' : gasPrice > 25 ? 'degraded' : 'healthy';

    return {
      chainId,
      chainName: this.getChainName(chainId),
      blockNumber: 19000000 + Math.floor(Math.random() * 100000),
      gasPrice: Number(gasPrice.toFixed(2)),
      tps: Math.floor(Math.random() * 30) + 10,
      avgBlockTime: 12 + Math.random() * 2,
      pendingTxCount: Math.floor(Math.random() * 50000) + 10000,
      networkHealth: health
    };
  }

  async getLargeTransactions(limit: number = 20, minValue: number = 10000): Promise<LargeTransaction[]> {
    const transactions: LargeTransaction[] = [];
    const tokens = ['ETH', 'WETH', 'WBTC', 'USDC', 'USDT', 'BNB'];

    for (let i = 0; i < limit; i++) {
      const value = (Math.random() * 10000000 + minValue);
      transactions.push({
        hash: this.generateHash(),
        from: `0x${Math.random().toString(16).slice(2, 42)}`,
        to: `0x${Math.random().toString(16).slice(2, 42)}`,
        value: Number(value.toFixed(4)),
        valueUsd: Number((value * (Math.random() > 0.5 ? 2850 : 1)).toFixed(2)),
        timestamp: Date.now() - Math.floor(Math.random() * 86400000),
        blockNumber: 19000000 + Math.floor(Math.random() * 10000),
        gasPrice: Number((Math.random() * 50 + 10).toFixed(2)),
        token: tokens[Math.floor(Math.random() * tokens.length)]
      });
    }

    return transactions.sort((a, b) => b.valueUsd - a.valueUsd);
  }

  async getPopularTokens(): Promise<PopularToken[]> {
    return this.popularTokens.map(token => {
      const priceChange = (Math.random() * 20 - 10);
      return {
        symbol: token.symbol,
        name: token.name,
        price: token.basePrice * (1 + priceChange / 100),
        priceChange24h: Number(priceChange.toFixed(2)),
        volume24h: Number((Math.random() * 1000000000 + 100000000).toFixed(0)),
        holders: Math.floor(Math.random() * 1000000) + 10000,
        transactions24h: Math.floor(Math.random() * 500000) + 10000
      };
    });
  }

  async getActiveAddresses(limit: number = 15): Promise<ActiveAddress[]> {
    const addresses: ActiveAddress[] = [];

    // Add exchanges
    for (const exchange of this.mockExchanges.slice(0, 5)) {
      addresses.push({
        address: `0x${Math.random().toString(16).slice(2, 42)}`,
        label: exchange,
        type: 'exchange',
        txCount24h: Math.floor(Math.random() * 100000) + 50000,
        volume24h: Number((Math.random() * 1000000000 + 100000000).toFixed(2))
      });
    }

    // Add whales
    for (const whale of this.mockWhales) {
      addresses.push({
        address: `0x${Math.random().toString(16).slice(2, 42)}`,
        label: whale,
        type: 'whale',
        txCount24h: Math.floor(Math.random() * 1000) + 100,
        volume24h: Number((Math.random() * 500000000 + 50000000).toFixed(2))
      });
    }

    // Add DeFi protocols
    const defiProtocols = ['Uniswap', 'Aave', 'Compound', 'Curve', 'MakerDAO'];
    for (const protocol of defiProtocols) {
      addresses.push({
        address: `0x${Math.random().toString(16).slice(2, 42)}`,
        label: protocol,
        type: 'defi',
        txCount24h: Math.floor(Math.random() * 5000) + 1000,
        volume24h: Number((Math.random() * 200000000 + 10000000).toFixed(2))
      });
    }

    return addresses.sort((a, b) => b.txCount24h - a.txCount24h).slice(0, limit);
  }

  async getNetworkStats(): Promise<NetworkStats> {
    return {
      totalValueLocked: 250000000000,
      totalTransactions24h: 15000000,
      uniqueAddresses: 5000000,
      avgGasPrice: Number((Math.random() * 30 + 15).toFixed(2)),
      newTokens24h: Math.floor(Math.random() * 50) + 10,
      newContracts24h: Math.floor(Math.random() * 500) + 100
    };
  }

  async getMultiChainData(): Promise<ChainData[]> {
    return this.chains.map(chain => ({
      ...chain,
      tvl: chain.tvl * (0.9 + Math.random() * 0.2),
      tx24h: Math.floor(chain.tx24h * (0.8 + Math.random() * 0.4)),
      gasPrice: chain.gasPrice * (0.8 + Math.random() * 0.4),
      activeAddresses: Math.floor(chain.activeAddresses * (0.9 + Math.random() * 0.2)),
      health: Math.min(100, chain.health + Math.floor(Math.random() * 5) - 2)
    }));
  }

  async getHistoricalTPS(period: string = '24h'): Promise<{time: string; tps: number}[]> {
    const points = period === '1h' ? 12 : period === '24h' ? 24 : 168;
    const data = [];
    const now = Date.now();
    const interval = period === '1h' ? 300000 : 3600000;

    for (let i = 0; i < points; i++) {
      data.push({
        time: new Date(now - i * interval).toISOString(),
        tps: Math.floor(Math.random() * 30) + 10
      });
    }

    return data.reverse();
  }

  async getGasHistory(period: string = '24h'): Promise<{time: string; gasPrice: number}[]> {
    const points = period === '1h' ? 12 : period === '24h' ? 24 : 168;
    const data = [];
    const now = Date.now();
    const interval = period === '1h' ? 300000 : 3600000;

    for (let i = 0; i < points; i++) {
      data.push({
        time: new Date(now - i * interval).toISOString(),
        gasPrice: Number((Math.random() * 40 + 10).toFixed(2))
      });
    }

    return data.reverse();
  }

  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon',
      80001: 'Mumbai Testnet',
      42161: 'Arbitrum One',
      421613: 'Arbitrum Goerli',
      10: 'Optimism',
      56: 'BNB Smart Chain',
      8453: 'Base'
    };
    return names[chainId] || `Chain ${chainId}`;
  }
}

import { Injectable } from '@nestjs/common';

interface PriceFeed {
  pair: string;
  price: number;
  change24h: number;
  timestamp: number;
  source: string;
  chain: string;
}

interface NetworkInfo {
  chainId: number;
  name: string;
  chainlinkFeeds: string[];
}

@Injectable()
export class ChainlinkPriceService {
  // Mock data for Chainlink price feeds (in production, would query on-chain or API)
  private readonly mockPriceFeeds: PriceFeed[] = [
    { pair: 'ETH/USD', price: 2847.32, change24h: 2.34, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'BTC/USD', price: 64250.00, change24h: 1.82, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'SOL/USD', price: 145.67, change24h: 5.21, timestamp: Date.now(), source: 'Chainlink', chain: 'Solana' },
    { pair: 'LINK/USD', price: 18.45, change24h: -1.23, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'AAVE/USD', price: 312.80, change24h: 3.45, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'UNI/USD', price: 9.87, change24h: 0.56, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'MATIC/USD', price: 0.89, change24h: -2.15, timestamp: Date.now(), source: 'Chainlink', chain: 'Polygon' },
    { pair: 'AVAX/USD', price: 38.92, change24h: 4.12, timestamp: Date.now(), source: 'Chainlink', chain: 'Avalanche' },
    { pair: 'ARB/USD', price: 1.85, change24h: 1.95, timestamp: Date.now(), source: 'Chainlink', chain: 'Arbitrum' },
    { pair: 'OP/USD', price: 3.21, change24h: -0.85, timestamp: Date.now(), source: 'Chainlink', chain: 'Optimism' },
    { pair: 'BNB/USD', price: 598.40, change24h: 1.45, timestamp: Date.now(), source: 'Chainlink', chain: 'BSC' },
    { pair: 'DOGE/USD', price: 0.165, change24h: 8.32, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'XAU/USD', price: 2345.60, change24h: 0.32, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'EUR/USD', price: 1.0834, change24h: -0.12, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
    { pair: 'JPY/USD', price: 0.0067, change24h: 0.05, timestamp: Date.now(), source: 'Chainlink', chain: 'Ethereum' },
  ];

  private readonly networks: NetworkInfo[] = [
    { chainId: 1, name: 'Ethereum Mainnet', chainlinkFeeds: ['ETH/USD', 'BTC/USD', 'LINK/USD', 'AAVE/USD', 'UNI/USD'] },
    { chainId: 137, name: 'Polygon', chainlinkFeeds: ['MATIC/USD', 'ETH/USD', 'BTC/USD'] },
    { chainId: 42161, name: 'Arbitrum', chainlinkFeeds: ['ARB/USD', 'ETH/USD', 'BTC/USD'] },
    { chainId: 10, name: 'Optimism', chainlinkFeeds: ['OP/USD', 'ETH/USD', 'BTC/USD'] },
    { chainId: 56, name: 'BSC', chainlinkFeeds: ['BNB/USD', 'ETH/USD', 'BTC/USD'] },
    { chainId: 43114, name: 'Avalanche', chainlinkFeeds: ['AVAX/USD', 'ETH/USD', 'BTC/USD'] },
  ];

  async getPriceFeeds(chain?: string, asset?: string): Promise<PriceFeed[]> {
    let feeds = [...this.mockPriceFeeds];

    if (chain) {
      feeds = feeds.filter(f => f.chain.toLowerCase() === chain.toLowerCase());
    }

    if (asset) {
      feeds = feeds.filter(f => f.pair.toLowerCase().includes(asset.toLowerCase()));
    }

    return feeds;
  }

  async getLatestPrices(pairs?: string): Promise<PriceFeed[]> {
    if (!pairs) {
      return this.mockPriceFeeds;
    }

    const pairList = pairs.split(',').map(p => p.trim().toUpperCase());
    return this.mockPriceFeeds.filter(f => 
      pairList.some(p => f.pair.replace('/', '').includes(p) || p.includes(f.pair.replace('/', '')))
    );
  }

  async getPriceHistory(
    pair: string,
    interval: string = '1h',
    hours: number = 24
  ): Promise<{ timestamps: number[]; prices: number[] }> {
    const feed = this.mockPriceFeeds.find(f => f.pair.toUpperCase() === pair.toUpperCase());
    if (!feed) {
      return { timestamps: [], prices: [] };
    }

    const dataPoints = Math.min(hours, 24);
    const intervalMs = interval === '1m' ? 60000 : interval === '1h' ? 3600000 : 86400000;
    
    const timestamps: number[] = [];
    const prices: number[] = [];
    
    const now = Date.now();
    const basePrice = feed.price;
    
    for (let i = dataPoints; i >= 0; i--) {
      timestamps.push(now - i * intervalMs);
      // Add some random variation
      const variation = (Math.random() - 0.5) * 0.02 * basePrice;
      prices.push(basePrice + variation);
    }

    return { timestamps, prices };
  }

  async getSupportedNetworks(): Promise<NetworkInfo[]> {
    return this.networks;
  }
}

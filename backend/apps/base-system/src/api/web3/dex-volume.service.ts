import { Injectable } from '@nestjs/common';

interface DexInfo {
  name: string;
  volume24h: number;
  volumeChange24h: number;
  tvl: number;
  transactions24h: number;
  pairs: number;
}

interface PairInfo {
  address: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  volume24h: number;
  volumeChange24h: number;
  tvl: number;
  priceChange24h: number;
  liquidity: number;
}

interface VolumeDataPoint {
  timestamp: number;
  volume: number;
  transactions: number;
}

@Injectable()
export class DexVolumeService {
  private supportedChains = [
    { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
    { id: 'arb', name: 'Arbitrum', symbol: 'ARB' },
    { id: 'op', name: 'Optimism', symbol: 'OP' },
    { id: 'poly', name: 'Polygon', symbol: 'MATIC' },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
    { id: 'base', name: 'Base', symbol: 'BASE' },
  ];

  private supportedDexes = {
    eth: ['Uniswap V3', 'Uniswap V2', 'Sushiswap', 'Curve', 'Balancer'],
    arb: ['Uniswap V3', 'Sushiswap', 'Camelot', 'GMX'],
    op: ['Uniswap V3', 'Velodrome', 'Optimism'],
    poly: ['Uniswap V3', 'Quickswap', 'Sushiswap'],
    bsc: ['PancakeSwap', 'Biswap', 'Apeswap'],
    base: ['Uniswap V3', 'Baseswap', 'Aerodrome'],
  };

  async getDexStats(chain: string): Promise<{ chain: string; dexes: DexInfo[] }> {
    const chainId = chain || 'eth';
    const dexes = this.supportedDexes[chainId] || this.supportedDexes['eth'];

    // Simulate DEX statistics
    const dexStats: DexInfo[] = dexes.map((dex) => ({
      name: dex,
      volume24h: this.generateRandomVolume(dex),
      volumeChange24h: (Math.random() - 0.3) * 40,
      tvl: this.generateRandomTVL(dex),
      transactions24h: Math.floor(Math.random() * 500000) + 10000,
      pairs: Math.floor(Math.random() * 5000) + 500,
    }));

    // Sort by volume
    dexStats.sort((a, b) => b.volume24h - a.volume24h);

    return {
      chain: chainId,
      dexes: dexStats,
    };
  }

  async getTopPairs(
    chain: string,
    dex: string,
    limit: number = 50,
  ): Promise<{ pairs: PairInfo[]; dex: string; chain: string }> {
    const chainId = chain || 'eth';
    const dexName = dex || this.supportedDexes[chainId]?.[0] || 'Uniswap V3';

    const popularTokens = [
      { symbol: 'USDC', name: 'USD Coin' },
      { symbol: 'USDT', name: 'Tether USD' },
      { symbol: 'ETH', name: 'Ethereum' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
      { symbol: 'DAI', name: 'Dai Stablecoin' },
      { symbol: 'UNI', name: 'Uniswap' },
      { symbol: 'LINK', name: 'Chainlink' },
      { symbol: 'AAVE', name: 'Aave' },
      { symbol: 'MKR', name: 'Maker' },
      { symbol: 'SNX', name: 'Synthetix' },
      { symbol: 'CRV', name: 'Curve DAO' },
      { symbol: 'LDO', name: 'Lido DAO' },
      { symbol: 'ARB', name: 'Arbitrum' },
      { symbol: 'OP', name: 'Optimism' },
      { symbol: 'MATIC', name: 'Polygon' },
    ];

    const pairs: PairInfo[] = [];
    for (let i = 0; i < limit; i++) {
      const token0 = popularTokens[Math.floor(Math.random() * popularTokens.length)];
      const token1 = popularTokens[Math.floor(Math.random() * popularTokens.length)];

      if (token0.symbol === token1.symbol) continue;

      pairs.push({
        address: this.generateAddress(),
        token0: this.generateAddress(),
        token1: this.generateAddress(),
        token0Symbol: token0.symbol,
        token1Symbol: token1.symbol,
        volume24h: Math.random() * 100000000 + 100000,
        volumeChange24h: (Math.random() - 0.3) * 60,
        tvl: Math.random() * 500000000 + 1000000,
        priceChange24h: (Math.random() - 0.4) * 20,
        liquidity: Math.random() * 200000000 + 500000,
      });
    }

    // Sort by volume
    pairs.sort((a, b) => b.volume24h - a.volume24h);

    return {
      pairs,
      dex: dexName,
      chain: chainId,
    };
  }

  async getVolumeHistory(
    chain: string,
    dex: string,
    pair: string,
    days: number = 7,
  ): Promise<{
    pair: string;
    dex: string;
    chain: string;
    data: VolumeDataPoint[];
  }> {
    const now = Date.now();
    const data: VolumeDataPoint[] = [];
    const interval = (24 * 60 * 60 * 1000) / 24; // Hourly data points

    for (let i = days * 24; i >= 0; i--) {
      const timestamp = now - i * interval;
      const baseVolume = Math.random() * 50000000 + 10000000;
      const hourOfDay = new Date(timestamp).getHours();

      // Simulate time-of-day patterns (higher volume during US hours)
      let multiplier = 1;
      if (hourOfDay >= 14 && hourOfDay <= 21) {
        multiplier = 1.5;
      } else if (hourOfDay >= 0 && hourOfDay <= 6) {
        multiplier = 0.5;
      }

      data.push({
        timestamp,
        volume: baseVolume * multiplier,
        transactions: Math.floor(Math.random() * 10000) + 1000,
      });
    }

    return {
      pair: pair || '0x...',
      dex: dex || 'Uniswap V3',
      chain: chain || 'eth',
      data,
    };
  }

  async getSupportedDexes(chain: string): Promise<{ chain: string; dexes: string[] }> {
    const chainId = chain || 'eth';
    return {
      chain: chainId,
      dexes: this.supportedDexes[chainId] || this.supportedDexes['eth'],
    };
  }

  async getSupportedChains(): Promise<{ chains: typeof this.supportedChains }> {
    return { chains: this.supportedChains };
  }

  async getTokenVolume(
    chain: string,
    token: string,
    days: number = 7,
  ): Promise<{
    token: string;
    chain: string;
    totalVolume: number;
    averageVolume: number;
    volumeChange: number;
    data: VolumeDataPoint[];
  }> {
    const now = Date.now();
    const data: VolumeDataPoint[] = [];
    const interval = (24 * 60 * 60 * 1000) / 24;

    let totalVolume = 0;
    for (let i = days * 24; i >= 0; i--) {
      const timestamp = now - i * interval;
      const volume = Math.random() * 10000000 + 1000000;
      totalVolume += volume;

      data.push({
        timestamp,
        volume,
        transactions: Math.floor(Math.random() * 5000) + 500,
      });
    }

    return {
      token: token || 'ETH',
      chain: chain || 'eth',
      totalVolume,
      averageVolume: totalVolume / (days * 24),
      volumeChange: (Math.random() - 0.3) * 30,
      data,
    };
  }

  async compareDexVolumes(
    chain: string,
    days: number = 7,
  ): Promise<{
    chain: string;
    days: number;
    dexes: { name: string; volume: number; change: number; share: number }[];
  }> {
    const chainId = chain || 'eth';
    const dexes = this.supportedDexes[chainId] || this.supportedDexes['eth'];

    let totalVolume = 0;
    const dexVolumes = dexes.map((dex) => {
      const volume = this.generateRandomVolume(dex);
      totalVolume += volume;
      return {
        name: dex,
        volume,
        change: (Math.random() - 0.3) * 40,
        share: 0, // Will calculate after
      };
    });

    // Calculate market share
    dexVolumes.forEach((dex) => {
      dex.share = (dex.volume / totalVolume) * 100;
    });

    // Sort by volume
    dexVolumes.sort((a, b) => b.volume - a.volume);

    return {
      chain: chainId,
      days,
      dexes: dexVolumes,
    };
  }

  private generateRandomVolume(dex: string): number {
    const baseVolumes: Record<string, number> = {
      'Uniswap V3': 800000000,
      'Uniswap V2': 300000000,
      Sushiswap: 200000000,
      Curve: 150000000,
      Balancer: 100000000,
      PancakeSwap: 400000000,
      Quickswap: 80000000,
      Velodrome: 60000000,
      GMX: 50000000,
      Camelot: 40000000,
      Baseswap: 30000000,
      Aerodrome: 25000000,
      Biswap: 60000000,
      Apeswap: 40000000,
    };

    const base = baseVolumes[dex] || 50000000;
    return base * (0.8 + Math.random() * 0.4);
  }

  private generateRandomTVL(dex: string): number {
    const baseTVL: Record<string, number> = {
      'Uniswap V3': 5000000000,
      'Uniswap V2': 2000000000,
      Sushiswap: 1500000000,
      Curve: 3000000000,
      Balancer: 1000000000,
      PancakeSwap: 3000000000,
      Quickswap: 500000000,
      Velodrome: 400000000,
      GMX: 600000000,
      Camelot: 300000000,
      Baseswap: 200000000,
      Aerodrome: 150000000,
    };

    const base = baseTVL[dex] || 500000000;
    return base * (0.7 + Math.random() * 0.6);
  }

  private generateAddress(): string {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }
}

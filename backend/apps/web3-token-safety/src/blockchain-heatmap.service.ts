import { Injectable } from '@nestjs/common';

interface NetworkData {
  chainId: number;
  name: string;
  symbol: string;
  color: string;
  activity: number; // 0-100 heat value
  txCount: number;
  activeAddresses: number;
  gasPrice: number;
  gasPriceGwei: number;
  tvl: number;
  tvlChange24h: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  congestion: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: number;
}

interface HeatmapHistory {
  timestamp: number;
  data: {
    chainId: number;
    activity: number;
    txCount: number;
    gasPrice: number;
  }[];
}

@Injectable()
export class BlockchainHeatmapService {
  private readonly SUPPORTED_CHAINS = [
    { chainId: 1, name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
    { chainId: 56, name: 'BNB Chain', symbol: 'BNB', color: '#F3BA2F' },
    { chainId: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
    { chainId: 42161, name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0' },
    { chainId: 10, name: 'Optimism', symbol: 'ETH', color: '#FF0420' },
    { chainId: 8453, name: 'Base', symbol: 'ETH', color: '#0052FF' },
    { chainId: 43114, name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
    { chainId: 250, name: 'Fantom', symbol: 'FTM', color: '#1969FF' },
    { chainId: 1101, name: 'zkEVM', symbol: 'ETH', color: '#6F3ABA' },
    { chainId: 59144, name: 'Linea', symbol: 'ETH', color: '#121212' },
    { chainId: 534352, name: 'Scroll', symbol: 'ETH', color: '#C4A4FF' },
    { chainId: 324, name: 'zksync', symbol: 'ETH', color: '#2B2550' },
  ];

  // Simulate real-time network data
  private generateNetworkData(): NetworkData[] {
    const baseData: NetworkData[] = [
      { chainId: 1, name: 'Ethereum', symbol: 'ETH', color: '#627EEA', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 56, name: 'BNB Chain', symbol: 'BNB', color: '#F3BA2F', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247E5', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 42161, name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 10, name: 'Optimism', symbol: 'ETH', color: '#FF0420', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 8453, name: 'Base', symbol: 'ETH', color: '#0052FF', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 43114, name: 'Avalanche', symbol: 'AVAX', color: '#E84142', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 250, name: 'Fantom', symbol: 'FTM', color: '#1969FF', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 1101, name: 'zkEVM', symbol: 'ETH', color: '#6F3ABA', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 59144, name: 'Linea', symbol: 'ETH', color: '#121212', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 534352, name: 'Scroll', symbol: 'ETH', color: '#C4A4FF', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
      { chainId: 324, name: 'zksync', symbol: 'ETH', color: '#2B2550', activity: 0, txCount: 0, activeAddresses: 0, gasPrice: 0, gasPriceGwei: 0, tvl: 0, tvlChange24h: 0, price: 0, priceChange24h: 0, volume24h: 0, congestion: 'low', lastUpdated: 0 },
    ];

    // Base values for simulation
    const baseValues = {
      1: { tvl: 52e9, price: 2450, gasBase: 30, txBase: 1.2e6, addrBase: 500000 },
      56: { tvl: 4.5e9, price: 580, gasBase: 3, txBase: 3.5e6, addrBase: 800000 },
      137: { tvl: 1.1e9, price: 0.85, gasBase: 50, txBase: 2.5e6, addrBase: 400000 },
      42161: { tvl: 2.8e9, price: 2450, gasBase: 0.15, txBase: 0.8e6, addrBase: 150000 },
      10: { tvl: 3.2e9, price: 2450, gasBase: 0.002, txBase: 0.5e6, addrBase: 100000 },
      8453: { tvl: 1.5e9, price: 2450, gasBase: 0.01, txBase: 1.5e6, addrBase: 300000 },
      43114: { tvl: 0.9e9, price: 38, gasBase: 25, txBase: 0.6e6, addrBase: 120000 },
      250: { tvl: 0.4e9, price: 0.22, gasBase: 1, txBase: 0.4e6, addrBase: 80000 },
      1101: { tvl: 0.3e9, price: 2450, gasBase: 0.001, txBase: 0.3e6, addrBase: 60000 },
      59144: { tvl: 0.5e9, price: 2450, gasBase: 0.001, txBase: 0.4e6, addrBase: 70000 },
      534352: { tvl: 0.2e9, price: 2450, gasBase: 0.001, txBase: 0.2e6, addrBase: 40000 },
      324: { tvl: 0.3e9, price: 2450, gasBase: 0.001, txBase: 0.25e6, addrBase: 50000 },
    };

    const now = Date.now();
    const hourOfDay = new Date().getHours();
    
    // Activity factor based on time of day (UTC)
    const timeFactor = this.getTimeActivityFactor(hourOfDay);

    return baseData.map((network) => {
      const base = baseValues[network.chainId];
      if (!base) return network;

      // Add some randomness
      const activityRandom = 0.7 + Math.random() * 0.6;
      const activity = Math.min(100, Math.round(timeFactor * activityRandom * 100));
      
      const txCount = Math.round(base.txBase * activityRandom * (0.5 + timeFactor * 0.5));
      const activeAddresses = Math.round(base.addrBase * activityRandom * (0.4 + timeFactor * 0.6));
      
      // Gas price varies with activity
      const gasMultiplier = 1 + (activity / 100) * 2;
      const gasPriceGwei = Number((base.gasBase * gasMultiplier * (0.8 + Math.random() * 0.4)).toFixed(2));
      
      // TVL change
      const tvlChange24h = Number((Math.random() * 10 - 4).toFixed(2));
      const priceChange24h = Number((Math.random() * 8 - 3).toFixed(2));
      
      // Congestion level
      let congestion: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (activity > 85) congestion = 'critical';
      else if (activity > 65) congestion = 'high';
      else if (activity > 40) congestion = 'medium';

      return {
        ...network,
        activity,
        txCount,
        activeAddresses,
        gasPrice: gasPriceGwei * 1e9,
        gasPriceGwei,
        tvl: base.tvl,
        tvlChange24h,
        price: base.price,
        priceChange24h,
        volume24h: Math.round(txCount * base.price * 0.001),
        congestion,
        lastUpdated: now,
      };
    });
  }

  private getTimeActivityFactor(hourOfDay: number): number {
    // UTC hour activity pattern (simplified)
    const activity = [
      0.3, 0.2, 0.15, 0.1, 0.1, 0.15,  // 0-5 UTC (low)
      0.3, 0.5, 0.7, 0.85, 0.9, 0.95,  // 6-11 UTC (rising)
      1.0, 0.95, 0.9, 0.85, 0.9, 1.0,  // 12-17 UTC (peak)
      0.95, 0.85, 0.7, 0.5, 0.4, 0.35,  // 18-23 UTC (declining)
    ];
    return activity[hourOfDay] || 0.5;
  }

  async getNetworksHeatmap(): Promise<NetworkData[]> {
    return this.generateNetworkData();
  }

  async getNetworkDetails(chainId: number): Promise<NetworkData | null> {
    const networks = this.generateNetworkData();
    return networks.find((n) => n.chainId === chainId) || null;
  }

  async getHeatmapHistory(chainId?: string, period: string = '24h'): Promise<HeatmapHistory[]> {
    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const networks = this.generateNetworkData();
    const history: HeatmapHistory[] = [];
    
    const now = Date.now();
    const intervalMs = period === '24h' ? 3600000 : period === '7d' ? 3600000 * 4 : 3600000 * 24;
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = now - i * intervalMs;
      const hourOfDay = new Date(timestamp).getUTCHours();
      const timeFactor = this.getTimeActivityFactor(hourOfDay);
      
      const data = networks.map((n) => ({
        chainId: n.chainId,
        activity: Math.round(timeFactor * 100 * (0.7 + Math.random() * 0.3)),
        txCount: Math.round(n.txCount * timeFactor * (0.6 + Math.random() * 0.4)),
        gasPrice: Math.round(n.gasPriceGwei * (0.8 + Math.random() * 0.4) * 100) / 100,
      }));
      
      history.push({ timestamp, data });
    }
    
    // Filter by chainId if specified
    if (chainId) {
      const targetChainId = Number(chainId);
      return history.map((h) => ({
        timestamp: h.timestamp,
        data: h.data.filter((d) => d.chainId === targetChainId),
      }));
    }
    
    return history;
  }

  async getGasPricesAcrossChains(): Promise<{
    chainId: number;
    name: string;
    symbol: string;
    gasPriceGwei: number;
    congestion: string;
  }[]> {
    const networks = this.generateNetworkData();
    return networks.map((n) => ({
      chainId: n.chainId,
      name: n.name,
      symbol: n.symbol,
      gasPriceGwei: n.gasPriceGwei,
      congestion: n.congestion,
    }));
  }
}

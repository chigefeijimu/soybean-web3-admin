import { Injectable } from '@nestjs/common';

const SUPPORTED_CHAINS = [
  'Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Avalanche', 'Base', 
  'Solana', 'zkSync', 'Starknet', 'Linea', 'Scroll', 'Mantle', 'Fantom', 'Celo'
];

const SUPPORTED_BRIDGES = [
  { name: 'LayerZero', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'BSC', 'Base', 'Avax'] },
  { name: 'Stargate', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'BSC', 'Base'] },
  { name: 'Across', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'] },
  { name: 'Hop', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'] },
  { name: 'Wormhole', chains: ['Ethereum', 'Solana', 'Polygon', 'Arbitrum', 'Avalanche', 'BSC', 'Base'] },
  { name: 'Celer', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'BSC'] },
  { name: 'Axelar', chains: ['Ethereum', 'Polygon', 'Avalanche', 'Base', 'Fantom'] },
  { name: 'Orbiter', chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'zkSync', 'Starknet'] },
];

@Injectable()
export class Web3CrossChainBridgeAnalyticsService {
  private generateMockData() {
    return {
      totalVolume24h: Math.random() * 500000000 + 100000000,
      totalVolume7d: Math.random() * 3000000000 + 500000000,
      totalTransactions24h: Math.floor(Math.random() * 50000) + 10000,
      activeUsers24h: Math.floor(Math.random() * 20000) + 5000,
      averageGasFee: Math.random() * 50 + 10,
      successRate: Math.random() * 5 + 95,
    };
  }

  async getOverview(chainId?: string) {
    const overview = {
      totalVolume: this.generateMockData().totalVolume24h,
      totalTransactions: this.generateMockData().totalTransactions24h,
      activeUsers: this.generateMockData().activeUsers24h,
      avgTransactionTime: Math.random() * 300 + 60,
      avgSuccessRate: this.generateMockData().successRate,
      supportedBridges: SUPPORTED_BRIDGES.length,
      supportedChains: SUPPORTED_CHAINS.length,
      chains: SUPPORTED_CHAINS,
      bridges: SUPPORTED_BRIDGES.map(b => b.name),
    };

    return overview;
  }

  async getStats(timeRange: string, chainId?: string) {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    const stats = {
      timeRange,
      chainId: chainId || 'all',
      totalVolume: this.generateMockData().totalVolume24h * multiplier,
      totalTransactions: this.generateMockData().totalTransactions24h * multiplier,
      uniqueUsers: Math.floor(this.generateMockData().activeUsers24h * multiplier * 0.7),
      avgTransactionSize: Math.random() * 5000 + 1000,
      avgGasFee: this.generateMockData().averageGasFee,
      successRate: this.generateMockData().successRate,
      volumeByChain: SUPPORTED_CHAINS.slice(0, 8).map(chain => ({
        chain,
        volume: Math.random() * 100000000 * multiplier,
        transactions: Math.floor(Math.random() * 10000 * multiplier),
      })),
      volumeByBridge: SUPPORTED_BRIDGES.map(bridge => ({
        bridge: bridge.name,
        volume: Math.random() * 80000000 * multiplier,
        transactions: Math.floor(Math.random() * 8000 * multiplier),
      })),
    };

    return stats;
  }

  async getBridgeDetails(bridgeName: string, timeRange: string) {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const bridge = SUPPORTED_BRIDGES.find(b => b.name.toLowerCase() === bridgeName.toLowerCase()) || SUPPORTED_BRIDGES[0];
    
    const details = {
      name: bridge.name,
      supportedChains: bridge.chains,
      totalVolume: Math.random() * 200000000 * multiplier,
      totalTransactions: Math.floor(Math.random() * 20000 * multiplier),
      uniqueUsers: Math.floor(Math.random() * 10000 * multiplier),
      avgTransactionTime: Math.random() * 300 + 60,
      successRate: Math.random() * 5 + 95,
      avgGasFee: Math.random() * 50 + 10,
      volumeByChain: bridge.chains.slice(0, 5).map(chain => ({
        chain,
        volume: Math.random() * 50000000 * multiplier,
        transactions: Math.floor(Math.random() * 5000 * multiplier),
      })),
      recentTrends: this.generateTrendData(7),
      routeEfficiency: [
        { route: `${bridge.chains[0]}->${bridge.chains[1]}`, avgTime: Math.random() * 180 + 60, successRate: Math.random() * 5 + 95 },
        { route: `${bridge.chains[0]}->${bridge.chains[2]}`, avgTime: Math.random() * 240 + 90, successRate: Math.random() * 5 + 93 },
        { route: `${bridge.chains[1]}->${bridge.chains[2]}`, avgTime: Math.random() * 200 + 80, successRate: Math.random() * 5 + 94 },
      ],
    };

    return details;
  }

  async getPopularRoutes(limit: number, timeRange: string) {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const routes = [];
    
    for (let i = 0; i < limit; i++) {
      const sourceChain = SUPPORTED_CHAINS[Math.floor(Math.random() * 8)];
      let destChain = SUPPORTED_CHAINS[Math.floor(Math.random() * 8)];
      while (destChain === sourceChain) {
        destChain = SUPPORTED_CHAINS[Math.floor(Math.random() * 8)];
      }
      
      routes.push({
        id: i + 1,
        sourceChain,
        destChain,
        bridge: SUPPORTED_BRIDGES[Math.floor(Math.random() * SUPPORTED_BRIDGES.length)].name,
        volume: Math.random() * 50000000 * multiplier,
        transactions: Math.floor(Math.random() * 5000 * multiplier),
        avgTime: Math.random() * 300 + 60,
        successRate: Math.random() * 5 + 95,
      });
    }

    return routes.sort((a, b) => b.volume - a.volume);
  }

  async getPopularTokens(limit: number, timeRange: string) {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const popularTokens = [
      { symbol: 'USDC', name: 'USD Coin', bridgeVolume: Math.random() * 200000000 },
      { symbol: 'USDT', name: 'Tether', bridgeVolume: Math.random() * 180000000 },
      { symbol: 'ETH', name: 'Ethereum', bridgeVolume: Math.random() * 150000000 },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', bridgeVolume: Math.random() * 100000000 },
      { symbol: 'MATIC', name: 'Polygon', bridgeVolume: Math.random() * 80000000 },
      { symbol: 'ARB', name: 'Arbitrum', bridgeVolume: Math.random() * 60000000 },
      { symbol: 'OP', name: 'Optimism', bridgeVolume: Math.random() * 50000000 },
      { symbol: 'AVAX', name: 'Avalanche', bridgeVolume: Math.random() * 45000000 },
      { symbol: 'LINK', name: 'Chainlink', bridgeVolume: Math.random() * 35000000 },
      { symbol: 'UNI', name: 'Uniswap', bridgeVolume: Math.random() * 30000000 },
      { symbol: 'AAVE', name: 'Aave', bridgeVolume: Math.random() * 25000000 },
      { symbol: 'SNX', name: 'Synthetix', bridgeVolume: Math.random() * 20000000 },
      { symbol: 'CRV', name: 'Curve DAO', bridgeVolume: Math.random() * 18000000 },
      { symbol: 'LDO', name: 'Lido DAO', bridgeVolume: Math.random() * 15000000 },
      { symbol: 'MKR', name: 'Maker', bridgeVolume: Math.random() * 12000000 },
    ];

    return popularTokens.slice(0, limit).map((token, index) => ({
      ...token,
      rank: index + 1,
      volume24h: token.bridgeVolume * multiplier,
      transactions24h: Math.floor(Math.random() * 10000 * multiplier),
      avgTransactionSize: Math.random() * 5000 + 1000,
    }));
  }

  async getTrends(timeRange: string, interval: string) {
    const points = interval === '1h' ? 24 : interval === '24h' ? 30 : 12;
    const trends = [];
    
    for (let i = 0; i < points; i++) {
      const date = new Date();
      if (interval === '1h') {
        date.setHours(date.getHours() - (points - i));
      } else if (interval === '24h') {
        date.setDate(date.getDate() - (points - i));
      } else {
        date.setDate(date.getDate() - (points - i) * 7);
      }

      trends.push({
        timestamp: date.toISOString(),
        volume: Math.random() * 50000000 + 10000000,
        transactions: Math.floor(Math.random() * 10000) + 2000,
        uniqueUsers: Math.floor(Math.random() * 5000) + 1000,
        avgGasFee: Math.random() * 50 + 10,
        successRate: Math.random() * 5 + 95,
      });
    }

    return {
      timeRange,
      interval,
      data: trends,
    };
  }

  async getChainVolumeDistribution(timeRange: string) {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    return SUPPORTED_CHAINS.slice(0, 10).map(chain => ({
      chain,
      outboundVolume: Math.random() * 80000000 * multiplier,
      inboundVolume: Math.random() * 80000000 * multiplier,
      totalVolume: Math.random() * 150000000 * multiplier,
      transactions: Math.floor(Math.random() * 15000 * multiplier),
      uniqueSenders: Math.floor(Math.random() * 5000 * multiplier),
      uniqueReceivers: Math.floor(Math.random() * 5000 * multiplier),
      avgTransactionSize: Math.random() * 5000 + 1000,
    })).sort((a, b) => b.totalVolume - a.totalVolume);
  }

  async compareBridges(bridges: string[], timeRange: string) {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    return bridges.map(bridgeName => {
      const bridge = SUPPORTED_BRIDGES.find(b => b.name.toLowerCase() === bridgeName.toLowerCase());
      return {
        name: bridgeName,
        totalVolume: Math.random() * 150000000 * multiplier,
        totalTransactions: Math.floor(Math.random() * 15000 * multiplier),
        uniqueUsers: Math.floor(Math.random() * 8000 * multiplier),
        avgTransactionTime: Math.random() * 300 + 60,
        successRate: Math.random() * 5 + 95,
        avgGasFee: Math.random() * 50 + 10,
        marketShare: Math.random() * 30 + 5,
        supportedChains: bridge ? bridge.chains.length : 5,
      };
    }).sort((a, b) => b.totalVolume - a.totalVolume);
  }

  async getEfficiency(bridgeName?: string, timeRange: string) {
    const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const bridges = bridgeName 
      ? [SUPPORTED_BRIDGES.find(b => b.name.toLowerCase() === bridgeName.toLowerCase()) || SUPPORTED_BRIDGES[0]]
      : SUPPORTED_BRIDGES;

    return bridges.map(bridge => ({
      bridgeName: bridge.name,
      avgCompletionTime: Math.random() * 300 + 60,
      successRate: Math.random() * 5 + 95,
      gasEfficiency: Math.random() * 30 + 70,
      reliabilityScore: Math.random() * 20 + 80,
      userSatisfaction: Math.random() * 15 + 85,
      volumePerGas: Math.random() * 1000000 + 100000,
      transactionsPerSecond: Math.random() * 50 + 10,
      costPerTransaction: Math.random() * 30 + 5,
      riskScore: Math.random() * 30 + 10,
    }));
  }

  async getAlerts(severity?: string) {
    const alerts = [
      {
        id: '1',
        type: 'volume_spike',
        severity: 'warning',
        message: 'Uniswap bridge volume increased 150% in the last hour',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        affectedBridge: 'LayerZero',
        details: { volumeChange: 150, threshold: 100 },
      },
      {
        id: '2',
        type: 'success_rate_drop',
        severity: 'critical',
        message: 'Bridge success rate dropped below 90%',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        affectedBridge: 'Across',
        details: { successRate: 87.5, threshold: 90 },
      },
      {
        id: '3',
        type: 'gas_spike',
        severity: 'info',
        message: 'Average gas fee increased by 40%',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        affectedBridge: 'All',
        details: { gasChange: 40, avgGas: 45 },
      },
      {
        id: '4',
        type: 'new_route',
        severity: 'info',
        message: 'New bridge route added: Ethereum -> Base',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        affectedBridge: 'Stargate',
        details: { newRoute: 'Ethereum->Base' },
      },
      {
        id: '5',
        type: 'maintenance',
        severity: 'warning',
        message: 'Scheduled maintenance for Wormhole bridge',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        affectedBridge: 'Wormhole',
        details: { maintenanceWindow: '2 hours', scheduledTime: 'UTC 12:00' },
      },
    ];

    if (severity) {
      return alerts.filter(a => a.severity === severity);
    }
    return alerts;
  }

  async createAlert(alertDto: any) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...alertDto,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
  }

  private generateTrendData(points: number) {
    const data = [];
    for (let i = 0; i < points; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (points - i));
      data.push({
        date: date.toISOString().split('T')[0],
        volume: Math.random() * 50000000 + 10000000,
        transactions: Math.floor(Math.random() * 10000) + 2000,
      });
    }
    return data;
  }
}

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface Activity {
  id: string;
  address: string;
  chain: string;
  type: 'transfer' | 'swap' | 'stake' | 'unstake' | 'mint' | 'burn' | 'borrow' | 'repay' | 'liquidate' | 'bridge' | 'approve' | 'nft_transfer' | 'contract_interaction';
  hash: string;
  timestamp: number;
  from?: string;
  to?: string;
  token?: string;
  amount?: string;
  value?: number;
  gasUsed?: number;
  gasFee?: number;
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: Record<string, any>;
}

export interface ActivityFeedQuery {
  address?: string;
  chains?: string[];
  types?: string[];
  startTime?: number;
  endTime?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityStats {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  byChain: Record<string, number>;
  byType: Record<string, number>;
  byDay: Record<string, number>;
}

export interface ActivityFeedResponse {
  activities: Activity[];
  stats: ActivityStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

@Injectable()
export class ActivityFeedService {
  private readonly supportedChains = [
    'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche',
    'solana', 'zksync', 'starknet', 'linea', 'scroll', 'mantle', 'fantom', 'celo'
  ];

  private readonly activityTypes = [
    'transfer', 'swap', 'stake', 'unstake', 'mint', 'burn', 'borrow', 'repay',
    'liquidate', 'bridge', 'approve', 'nft_transfer', 'contract_interaction'
  ];

  private mockActivities: Activity[] = [];
  private initialized = false;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    if (this.initialized) return;
    
    const addresses = [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0fAb1',
      '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    ];

    const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI', 'AAVE', 'LINK', 'MATIC', 'OP', 'ARB'];
    const types = this.activityTypes;

    for (let i = 0; i < 200; i++) {
      const chain = this.supportedChains[Math.floor(Math.random() * 7)];
      const type = types[Math.floor(Math.random() * types.length)] as Activity['type'];
      const address = addresses[Math.floor(Math.random() * addresses.length)];
      const timestamp = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const activity: Activity = {
        id: `activity_${i}_${Math.random().toString(36).substr(2, 9)}`,
        address,
        chain,
        type,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp,
        from: address,
        to: addresses[Math.floor(Math.random() * addresses.length)],
        token: tokens[Math.floor(Math.random() * tokens.length)],
        amount: (Math.random() * 1000).toFixed(4),
        value: Math.random() * 10000,
        gasUsed: Math.floor(Math.random() * 200000) + 21000,
        gasFee: Math.random() * 0.01,
        status: Math.random() > 0.1 ? 'confirmed' : Math.random() > 0.5 ? 'pending' : 'failed',
      };

      this.mockActivities.push(activity);
    }

    this.mockActivities.sort((a, b) => b.timestamp - a.timestamp);
    this.initialized = true;
  }

  async getActivityFeed(query: ActivityFeedQuery): Promise<ActivityFeedResponse> {
    this.initializeMockData();

    let filtered = [...this.mockActivities];

    if (query.address) {
      filtered = filtered.filter(a => 
        a.address.toLowerCase() === query.address!.toLowerCase() ||
        a.from?.toLowerCase() === query.address!.toLowerCase() ||
        a.to?.toLowerCase() === query.address!.toLowerCase()
      );
    }

    if (query.chains && query.chains.length > 0) {
      filtered = filtered.filter(a => query.chains!.includes(a.chain));
    }

    if (query.types && query.types.length > 0) {
      filtered = filtered.filter(a => query.types!.includes(a.type));
    }

    if (query.startTime) {
      filtered = filtered.filter(a => a.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      filtered = filtered.filter(a => a.timestamp <= query.endTime!);
    }

    if (query.status) {
      filtered = filtered.filter(a => a.status === query.status);
    }

    const total = filtered.length;
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    
    const paginated = filtered.slice(offset, offset + limit);

    const stats = this.calculateStats(filtered);

    return {
      activities: paginated,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async getActivityById(id: string): Promise<Activity | null> {
    this.initializeMockData();
    return this.mockActivities.find(a => a.id === id) || null;
  }

  async getActivityByHash(hash: string, chain?: string): Promise<Activity | null> {
    this.initializeMockData();
    return this.mockActivities.find(a => 
      a.hash.toLowerCase() === hash.toLowerCase() && 
      (!chain || a.chain === chain)
    ) || null;
  }

  async getAddressActivities(address: string, limit = 50): Promise<Activity[]> {
    this.initializeMockData();
    return this.mockActivities
      .filter(a => 
        a.address.toLowerCase() === address.toLowerCase() ||
        a.from?.toLowerCase() === address.toLowerCase() ||
        a.to?.toLowerCase() === address.toLowerCase()
      )
      .slice(0, limit);
  }

  async getRecentActivities(limit = 20): Promise<Activity[]> {
    this.initializeMockData();
    return this.mockActivities.slice(0, limit);
  }

  async getChainActivities(chain: string, limit = 50): Promise<Activity[]> {
    this.initializeMockData();
    return this.mockActivities
      .filter(a => a.chain === chain)
      .slice(0, limit);
  }

  async getStats(): Promise<ActivityStats> {
    this.initializeMockData();
    return this.calculateStats(this.mockActivities);
  }

  private calculateStats(activities: Activity[]): ActivityStats {
    const stats: ActivityStats = {
      total: activities.length,
      pending: 0,
      confirmed: 0,
      failed: 0,
      byChain: {},
      byType: {},
      byDay: {},
    };

    for (const activity of activities) {
      if (activity.status === 'pending') stats.pending++;
      else if (activity.status === 'confirmed') stats.confirmed++;
      else if (activity.status === 'failed') stats.failed++;

      stats.byChain[activity.chain] = (stats.byChain[activity.chain] || 0) + 1;
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;

      const day = new Date(activity.timestamp).toISOString().split('T')[0];
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    }

    return stats;
  }

  async searchActivities(keyword: string, limit = 20): Promise<Activity[]> {
    this.initializeMockData();
    const keywordLower = keyword.toLowerCase();
    
    return this.mockActivities
      .filter(a => 
        a.address.toLowerCase().includes(keywordLower) ||
        a.hash.toLowerCase().includes(keywordLower) ||
        a.token?.toLowerCase().includes(keywordLower) ||
        a.from?.toLowerCase().includes(keywordLower) ||
        a.to?.toLowerCase().includes(keywordLower)
      )
      .slice(0, limit);
  }

  async getActivityTimeline(address: string, days = 7): Promise<{ date: string; count: number }[]> {
    this.initializeMockData();
    
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const activities = this.mockActivities.filter(a => 
      (a.address.toLowerCase() === address.toLowerCase() ||
       a.from?.toLowerCase() === address.toLowerCase() ||
       a.to?.toLowerCase() === address.toLowerCase()) &&
      a.timestamp >= startTime
    );

    const timeline: Record<string, number> = {};
    
    for (const activity of activities) {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    }

    const result: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      result.unshift({ date, count: timeline[date] || 0 });
    }

    return result;
  }

  async getActivityHeatmap(address: string): Promise<number[][]> {
    this.initializeMockData();
    
    // 7 days x 24 hours heatmap
    const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    const activities = this.mockActivities.filter(a => 
      a.address.toLowerCase() === address.toLowerCase() ||
      a.from?.toLowerCase() === address.toLowerCase() ||
      a.to?.toLowerCase() === address.toLowerCase()
    );

    for (const activity of activities) {
      const date = new Date(activity.timestamp);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      heatmap[dayOfWeek][hour]++;
    }

    return heatmap;
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  getActivityTypes(): string[] {
    return this.activityTypes;
  }
}

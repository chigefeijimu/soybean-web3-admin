import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface SmartMoneyAlert {
  id: string;
  userId: string;
  walletAddress: string;
  walletLabel?: string;
  chain: string;
  alertType: 'any_activity' | 'large_transfer' | 'defi_interaction' | 'nft_activity' | 'token_buy' | 'token_sell';
  threshold?: number;
  webhookUrl?: string;
  enabled: boolean;
  createdAt: string;
  triggeredCount: number;
}

export interface SmartMoneyWallet {
  address: string;
  label: string;
  category: 'whale' | 'trader' | 'degen' | 'institution' | 'unknown';
  chains: string[];
  totalVolume: number;
  recentActivity?: {
    type: string;
    token: string;
    amount: number;
    timestamp: string;
    chain: string;
  }[];
  riskScore: number;
  followerCount: number;
  verified: boolean;
}

export interface AlertTrigger {
  id: string;
  alertId: string;
  walletAddress: string;
  chain: string;
  transactionHash: string;
  activity: {
    type: string;
    token?: string;
    amount?: number;
    usdValue?: number;
    from?: string;
    to?: string;
  };
  triggeredAt: string;
  notified: boolean;
}

@Injectable()
export class SmartMoneyAlertService {
  private alerts: Map<string, SmartMoneyAlert> = new Map();
  private wallets: Map<string, SmartMoneyWallet> = new Map();
  private triggers: Map<string, AlertTrigger[]> = new Map();

  constructor(private httpService: HttpService) {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize mock smart money wallets
    const mockWallets: SmartMoneyWallet[] = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
        label: 'Vitalik Buterin',
        category: 'institution',
        chains: ['ethereum'],
        totalVolume: 2500000000,
        recentActivity: [
          { type: 'transfer', token: 'ETH', amount: 100, timestamp: new Date().toISOString(), chain: 'ethereum' }
        ],
        riskScore: 15,
        followerCount: 15234,
        verified: true
      },
      {
        address: '0x8B8D4B53e58D0a7C82C9c3D6c2eEb3f2c9d1E8F3',
        label: 'DeFi Whale Alpha',
        category: 'whale',
        chains: ['ethereum', 'arbitrum', 'optimism'],
        totalVolume: 850000000,
        recentActivity: [
          { type: 'swap', token: 'USDC', amount: 5000000, timestamp: new Date().toISOString(), chain: 'ethereum' }
        ],
        riskScore: 35,
        followerCount: 8952,
        verified: true
      },
      {
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aEC9B',
        label: 'Crypto Whale #1',
        category: 'whale',
        chains: ['ethereum', 'bsc'],
        totalVolume: 1200000000,
        recentActivity: [
          { type: 'defi_interaction', token: 'AAVE', amount: 2500000, timestamp: new Date().toISOString(), chain: 'ethereum' }
        ],
        riskScore: 42,
        followerCount: 12543,
        verified: true
      },
      {
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        label: 'Uniswap V3 Router',
        category: 'institution',
        chains: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
        totalVolume: 15000000000,
        riskScore: 5,
        followerCount: 50000,
        verified: true
      },
      {
        address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        label: 'Uniswap V2 Router',
        category: 'institution',
        chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc'],
        totalVolume: 20000000000,
        riskScore: 5,
        followerCount: 75000,
        verified: true
      },
      {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
        label: 'Vitalik (vitalik.eth)',
        category: 'institution',
        chains: ['ethereum', 'polygon', 'optimism'],
        totalVolume: 1800000000,
        recentActivity: [
          { type: 'transfer', token: 'ETH', amount: 50, timestamp: new Date().toISOString(), chain: 'ethereum' }
        ],
        riskScore: 10,
        followerCount: 25000,
        verified: true
      },
      {
        address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
        label: 'Polygon (Matic) Fund',
        category: 'institution',
        chains: ['ethereum', 'polygon'],
        totalVolume: 3500000000,
        riskScore: 8,
        followerCount: 12000,
        verified: true
      },
      {
        address: '0xC36442b4a4522E641399a0d1E6D3d5C3E4b7F9C2',
        label: 'Arbitrum Foundation',
        category: 'institution',
        chains: ['ethereum', 'arbitrum'],
        totalVolume: 2800000000,
        riskScore: 12,
        followerCount: 8500,
        verified: true
      }
    ];

    mockWallets.forEach(w => this.wallets.set(w.address.toLowerCase(), w));

    // Initialize mock alerts
    const mockAlerts: SmartMoneyAlert[] = [
      {
        id: 'alert_001',
        userId: 'user_001',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
        walletLabel: 'Vitalik Buterin',
        chain: 'ethereum',
        alertType: 'any_activity',
        webhookUrl: 'https://example.com/webhook',
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredCount: 5
      }
    ];

    mockAlerts.forEach(a => this.alerts.set(a.id, a));
  }

  // Get all smart money wallets with filters
  async getWallets(filters: {
    category?: string;
    chain?: string;
    minVolume?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ wallets: SmartMoneyWallet[]; total: number }> {
    let wallets = Array.from(this.wallets.values());

    if (filters.category) {
      wallets = wallets.filter(w => w.category === filters.category);
    }
    if (filters.chain) {
      wallets = wallets.filter(w => w.chains.includes(filters.chain.toLowerCase()));
    }
    if (filters.minVolume) {
      wallets = wallets.filter(w => w.totalVolume >= filters.minVolume!);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      wallets = wallets.filter(w => 
        w.address.toLowerCase().includes(search) || 
        w.label.toLowerCase().includes(search)
      );
    }

    const total = wallets.length;
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    wallets = wallets.slice(offset, offset + limit);

    return { wallets, total };
  }

  // Get wallet details
  async getWalletDetails(address: string): Promise<SmartMoneyWallet | null> {
    return this.wallets.get(address.toLowerCase()) || null;
  }

  // Create alert
  async createAlert(data: {
    userId: string;
    walletAddress: string;
    chain: string;
    alertType: SmartMoneyAlert['alertType'];
    threshold?: number;
    webhookUrl?: string;
  }): Promise<SmartMoneyAlert> {
    const wallet = this.wallets.get(data.walletAddress.toLowerCase());
    const alert: SmartMoneyAlert = {
      id: `alert_${Date.now()}`,
      ...data,
      walletLabel: wallet?.label,
      enabled: true,
      createdAt: new Date().toISOString(),
      triggeredCount: 0
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  // Get user alerts
  async getAlerts(userId: string): Promise<SmartMoneyAlert[]> {
    return Array.from(this.alerts.values()).filter(a => a.userId === userId);
  }

  // Update alert
  async updateAlert(alertId: string, data: Partial<SmartMoneyAlert>): Promise<SmartMoneyAlert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    const updated = { ...alert, ...data };
    this.alerts.set(alertId, updated);
    return updated;
  }

  // Delete alert
  async deleteAlert(alertId: string): Promise<boolean> {
    return this.alerts.delete(alertId);
  }

  // Get alert triggers
  async getTriggers(alertId: string, limit = 20): Promise<AlertTrigger[]> {
    return this.triggers.get(alertId)?.slice(-limit) || [];
  }

  // Get market overview
  async getMarketOverview(): Promise<{
    topWhales: SmartMoneyWallet[];
    recentActivity: AlertTrigger[];
    categories: { name: string; count: number }[];
    chains: { name: string; count: number }[];
  }> {
    const wallets = Array.from(this.wallets.values());
    
    // Get top whales by volume
    const topWhales = wallets
      .filter(w => w.category === 'whale')
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 10);

    // Category distribution
    const categoryMap = new Map<string, number>();
    wallets.forEach(w => {
      categoryMap.set(w.category, (categoryMap.get(w.category) || 0) + 1);
    });
    const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));

    // Chain distribution
    const chainMap = new Map<string, number>();
    wallets.forEach(w => {
      w.chains.forEach(c => {
        chainMap.set(c, (chainMap.get(c) || 0) + 1);
      });
    });
    const chains = Array.from(chainMap.entries()).map(([name, count]) => ({ name, count }));

    return {
      topWhales,
      recentActivity: [],
      categories,
      chains
    };
  }

  // Get popular wallets (most followers)
  async getPopularWallets(limit = 20): Promise<SmartMoneyWallet[]> {
    return Array.from(this.wallets.values())
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, limit);
  }

  // Search wallets
  async searchWallets(query: string, limit = 10): Promise<SmartMoneyWallet[]> {
    const q = query.toLowerCase();
    return Array.from(this.wallets.values())
      .filter(w => w.address.toLowerCase().includes(q) || w.label.toLowerCase().includes(q))
      .slice(0, limit);
  }

  // Get wallet activity history
  async getWalletActivity(
    address: string, 
    options: { chain?: string; type?: string; limit?: number; offset?: number }
  ): Promise<{ activities: any[]; total: number }> {
    const wallet = this.wallets.get(address.toLowerCase());
    if (!wallet) return { activities: [], total: 0 };

    // Generate mock activity data
    const activities = [];
    const types = ['transfer', 'swap', 'defi_interaction', 'nft_activity', 'token_buy', 'token_sell'];
    const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'AAVE', 'UNI', 'LINK', 'MATIC'];
    const chains = wallet.chains;

    for (let i = 0; i < 30; i++) {
      activities.push({
        id: `activity_${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        token: tokens[Math.floor(Math.random() * tokens.length)],
        amount: Math.random() * 1000000,
        usdValue: Math.random() * 5000000,
        chain: chains[Math.floor(Math.random() * chains.length)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      });
    }

    let filtered = activities;
    if (options.chain) {
      filtered = filtered.filter(a => a.chain === options.chain);
    }
    if (options.type) {
      filtered = filtered.filter(a => a.type === options.type);
    }

    const total = filtered.length;
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    return {
      activities: filtered.slice(offset, offset + limit),
      total
    };
  }
}

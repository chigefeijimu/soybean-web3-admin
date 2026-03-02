import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface FollowedWallet {
  address: string;
  label: string;
  category: string;
  followedAt: number;
  notes: string;
}

export interface WalletActivity {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: string;
  tokenValue: string;
  timestamp: number;
  type: 'swap' | 'transfer' | 'nft' | 'defi' | 'stake' | 'unknown';
  chain: string;
  gasUsed: string;
  status: 'success' | 'failed';
}

export interface WalletStats {
  totalTransactions: number;
  totalVolume: string;
  avgTransactionSize: string;
  topTokens: string[];
  mostActiveHour: number;
  activityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SocialFeedItem {
  wallet: string;
  label: string;
  activity: WalletActivity;
  followers: number;
}

export interface NotificationConfig {
  userId?: string;
  walletAddress: string;
  notifyOnSwap: boolean;
  notifyOnTransfer: boolean;
  notifyOnNFT: boolean;
  notifyOnDefi: boolean;
  minTransactionValue: number;
}

@Injectable()
export class WalletSocialService {
  private readonly rpcUrls: Record<number, string> = {
    1: 'https://eth.llamarpc.com',
    56: 'https://bsc-dataseed.binance.org',
    137: 'https://polygon-rpc.com',
    42161: 'https://arb1.arbitrum.io/rpc',
    10: 'https://mainnet.optimism.io',
    8453: 'https://mainnet.base.org',
    43114: 'https://api.avax.network',
  };

  // In-memory storage for demo (replace with database in production)
  private followedWallets: Map<string, FollowedWallet[]> = new Map();
  private notifications: Map<string, NotificationConfig[]> = new Map();
  private activityCache: Map<string, WalletActivity[]> = new Map();

  // Known whale addresses for demo
  private readonly knownWhales: Record<string, { label: string; category: string }> = {
    '0x8ba1f109551bD432803012645Ac136ddd64DBA72': { label: 'Binance Hot Wallet', category: 'CEX' },
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C1e2D1e409d1': { label: 'Vitalik Buterin', category: 'Person' },
    '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B': { label: 'Vitalik.eth', category: 'Person' },
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': { label: 'Vitalik (vitalik.eth)', category: 'Person' },
    '0x7182f6a27A549F备aa3D1A7B9C7aB1f3D5eF4f4a': { label: 'Polygon Team', category: 'Team' },
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { label: 'USDC Contract', category: 'Protocol' },
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': { label: 'WETH Contract', category: 'Protocol' },
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Follow a wallet
   */
  async followWallet(
    userId: string,
    walletAddress: string,
    label?: string,
    category?: string,
    notes?: string
  ): Promise<{ success: boolean; wallet: FollowedWallet }> {
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Check if already following
    const userWallets = this.followedWallets.get(userId) || [];
    const existingIndex = userWallets.findIndex(w => w.address === normalizedAddress);
    
    if (existingIndex >= 0) {
      throw new HttpException(
        'Already following this wallet',
        HttpStatus.BAD_REQUEST
      );
    }

    // Auto-detect label if not provided
    const detectedLabel = label || this.knownWhales[normalizedAddress]?.label || 'Unknown';
    const detectedCategory = category || this.knownWhales[normalizedAddress]?.category || 'Custom';

    const newWallet: FollowedWallet = {
      address: normalizedAddress,
      label: detectedLabel,
      category: detectedCategory,
      followedAt: Date.now(),
      notes: notes || '',
    };

    userWallets.push(newWallet);
    this.followedWallets.set(userId, userWallets);

    return { success: true, wallet: newWallet };
  }

  /**
   * Unfollow a wallet
   */
  async unfollowWallet(userId: string, walletAddress: string): Promise<{ success: boolean }> {
    const normalizedAddress = walletAddress.toLowerCase();
    const userWallets = this.followedWallets.get(userId) || [];
    
    const filteredWallets = userWallets.filter(w => w.address !== normalizedAddress);
    
    if (filteredWallets.length === userWallets.length) {
      throw new HttpException(
        'Not following this wallet',
        HttpStatus.BAD_REQUEST
      );
    }

    this.followedWallets.set(userId, filteredWallets);
    return { success: true };
  }

  /**
   * Get followed wallets
   */
  async getFollowedWallets(userId: string): Promise<FollowedWallet[]> {
    return this.followedWallets.get(userId) || [];
  }

  /**
   * Get wallet activity
   */
  async getWalletActivity(
    address: string,
    chainId: number = 1,
    limit: number = 20
  ): Promise<WalletActivity[]> {
    // Try to fetch from RPC (simulated for demo)
    try {
      const rpcUrl = this.rpcUrls[chainId] || this.rpcUrls[1];
      
      // Get transaction count
      const txCountResponse = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
          id: 1,
        })
      );
      
      const txCount = parseInt(txCountResponse.data.result || '0x0', 16);
      
      // Generate sample transactions based on known patterns
      const activities = this.generateSampleActivities(address, chainId, Math.min(txCount, limit));
      return activities;
      
    } catch (error) {
      // Return sample data for demo
      return this.generateSampleActivities(address, chainId, limit);
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(address: string, chainId: number = 1): Promise<WalletStats> {
    const activities = await this.getWalletActivity(address, chainId, 100);
    
    // Calculate statistics
    const totalTransactions = activities.length;
    const totalVolume = activities.reduce((sum, a) => sum + parseFloat(a.tokenValue || '0'), 0);
    const avgTransactionSize = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
    
    // Token frequency
    const tokenCounts: Record<string, number> = {};
    for (const activity of activities) {
      tokenCounts[activity.token] = (tokenCounts[activity.token] || 0) + 1;
    }
    const topTokens = Object.entries(tokenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([token]) => token);
    
    // Activity score based on transaction frequency and volume
    const activityScore = Math.min(100, Math.round((totalTransactions / 10) * 10 + (totalVolume / 1000)));
    
    // Risk level based on activity patterns
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalVolume > 1000000 || activityScore > 80) {
      riskLevel = 'high';
    } else if (totalVolume > 100000 || activityScore > 50) {
      riskLevel = 'medium';
    }

    return {
      totalTransactions,
      totalVolume: totalVolume.toFixed(2),
      avgTransactionSize: avgTransactionSize.toFixed(2),
      topTokens,
      mostActiveHour: Math.floor(Math.random() * 24),
      activityScore,
      riskLevel,
    };
  }

  /**
   * Get social feed for followed wallets
   */
  async getSocialFeed(userId: string, limit: number = 20): Promise<SocialFeedItem[]> {
    const followedWallets = this.followedWallets.get(userId) || [];
    const feed: SocialFeedItem[] = [];
    
    for (const wallet of followedWallets) {
      const activities = await this.getWalletActivity(wallet.address, 1, 5);
      
      for (const activity of activities) {
        feed.push({
          wallet: wallet.address,
          label: wallet.label,
          activity,
          followers: Math.floor(Math.random() * 1000) + 100,
        });
      }
    }
    
    // Sort by timestamp (newest first)
    feed.sort((a, b) => b.activity.timestamp - a.activity.timestamp);
    
    return feed.slice(0, limit);
  }

  /**
   * Configure notifications for a wallet
   */
  async configureNotifications(
    userId: string,
    config: NotificationConfig
  ): Promise<{ success: boolean }> {
    const userNotifications = this.notifications.get(userId) || [];
    
    // Remove existing config for this wallet if any
    const filtered = userNotifications.filter(n => n.walletAddress !== config.walletAddress);
    filtered.push(config);
    
    this.notifications.set(userId, filtered);
    return { success: true };
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(userId: string): Promise<NotificationConfig[]> {
    return this.notifications.get(userId) || [];
  }

  /**
   * Check if address is a known whale/celebrity
   */
  async lookupAddress(address: string): Promise<{
    isKnown: boolean;
    label?: string;
    category?: string;
    riskAssessment?: string;
  }> {
    const normalizedAddress = address.toLowerCase();
    const known = this.knownWhales[normalizedAddress];
    
    if (known) {
      return {
        isKnown: true,
        label: known.label,
        category: known.category,
        riskAssessment: this.getRiskAssessment(known.category),
      };
    }
    
    return { isKnown: false };
  }

  /**
   * Get trending wallets
   */
  async getTrendingWallets(limit: number = 10): Promise<{
    address: string;
    label: string;
    category: string;
    followerCount: number;
    recentActivity: number;
  }[]> {
    const trending: Array<{
      address: string;
      label: string;
      category: string;
      followerCount: number;
      recentActivity: number;
    }> = [];

    // Add known whales with simulated trending data
    const addresses = Object.entries(this.knownWhales);
    
    for (const [address, info] of addresses) {
      trending.push({
        address,
        label: info.label,
        category: info.category,
        followerCount: Math.floor(Math.random() * 5000) + 100,
        recentActivity: Math.floor(Math.random() * 100) + 10,
      });
    }

    // Sort by follower count
    trending.sort((a, b) => b.followerCount - a.followerCount);
    
    return trending.slice(0, limit);
  }

  /**
   * Compare multiple wallets
   */
  async compareWallets(addresses: string[]): Promise<{
    wallets: Array<{
      address: string;
      label: string;
      stats: WalletStats;
    }>;
    comparison: {
      mostActive: string;
      highestVolume: string;
      commonTokens: string[];
    };
  }> {
    const walletData = [];
    
    for (const address of addresses) {
      const normalizedAddress = address.toLowerCase();
      const label = this.knownWhales[normalizedAddress]?.label || 'Unknown';
      const stats = await this.getWalletStats(normalizedAddress);
      
      walletData.push({
        address: normalizedAddress,
        label,
        stats,
      });
    }

    // Find most active and highest volume
    const mostActive = walletData.reduce((max, w) => 
      w.stats.totalTransactions > max.stats.totalTransactions ? w : max
    );
    
    const highestVolume = walletData.reduce((max, w) => 
      parseFloat(w.stats.totalVolume) > parseFloat(max.stats.totalVolume) ? w : max
    );

    // Find common tokens
    const allTokenSets = walletData.map(w => new Set<string>(w.stats.topTokens));
    let commonTokens: string[] = [];
    if (allTokenSets.length > 0) {
      const firstSet = allTokenSets[0];
      commonTokens = [...firstSet].filter(token => allTokenSets.every(set => set.has(token)));
    }

    return {
      wallets: walletData,
      comparison: {
        mostActive: mostActive.address,
        highestVolume: highestVolume.address,
        commonTokens,
      },
    };
  }

  // Helper methods
  private generateSampleActivities(address: string, chainId: number, count: number): WalletActivity[] {
    const chains = ['Ethereum', 'BNB Chain', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Avalanche'];
    const tokens = ['ETH', 'USDC', 'USDT', 'WETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'MATIC'];
    const types: Array<'swap' | 'transfer' | 'nft' | 'defi' | 'stake'> = ['swap', 'transfer', 'transfer', 'defi', 'stake'];
    
    const activities: WalletActivity[] = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const value = (Math.random() * 10).toFixed(4);
      
      activities.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: address,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        value: (Math.random() * 2).toFixed(6),
        token,
        tokenValue: (parseFloat(value) * (token === 'ETH' ? 2500 : token === 'WBTC' ? 45000 : token === 'USDC' || token === 'USDT' ? 1 : Math.random() * 100)).toFixed(2),
        timestamp: now - (i * 3600000 * Math.random() * 24),
        type,
        chain: chains[chainId - 1] || 'Ethereum',
        gasUsed: (Math.floor(Math.random() * 21000) + 21000).toString(),
        status: Math.random() > 0.1 ? 'success' : 'failed',
      });
    }
    
    return activities;
  }

  private getRiskAssessment(category: string): string {
    const assessments: Record<string, string> = {
      'CEX': 'Low risk - Centralized exchange wallet',
      'Person': 'Medium risk - Individual wallet, activity varies',
      'Team': 'Low risk - Project team wallet',
      'Protocol': 'Low risk - Protocol contract address',
      'Whale': 'Medium risk - Large holder, may have significant influence',
    };
    return assessments[category] || 'Unknown risk profile';
  }
}

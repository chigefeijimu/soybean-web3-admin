import { Injectable } from '@nestjs/common';

interface WalletGroup {
  id: string;
  name: string;
  description?: string;
  wallets: string[];
  createdAt: number;
  updatedAt: number;
}

interface TokenHolding {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  balance: string;
  valueUSD: number;
  percentage: number;
}

interface PortfolioSummary {
  totalValueUSD: number;
  tokenCount: number;
  chainDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  topHoldings: TokenHolding[];
  change24h: number;
  change7d: number;
}

// In-memory storage (would use database in production)
const walletGroups: Map<string, WalletGroup> = new Map();

// Simulated price data
const tokenPrices: Record<string, number> = {
  ETH: 2450,
  BTC: 67500,
  SOL: 145,
  BNB: 580,
  XRP: 0.52,
  ADA: 0.45,
  AVAX: 35,
  MATIC: 0.85,
  LINK: 14.5,
  UNI: 7.2,
  AAVE: 95,
  MKR: 1450,
  CRV: 0.55,
  LD0: 2.1,
  ARB: 1.05,
  OP: 1.85,
};

@Injectable()
export class WalletGroupPortfolioService {
  /**
   * Create a new wallet group
   */
  async createGroup(
    name: string,
    description?: string,
    wallets: string[] = []
  ): Promise<WalletGroup> {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const group: WalletGroup = {
      id,
      name,
      description,
      wallets,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    walletGroups.set(id, group);
    return group;
  }

  /**
   * Get all wallet groups
   */
  async getAllGroups(): Promise<WalletGroup[]> {
    return Array.from(walletGroups.values());
  }

  /**
   * Get group by ID
   */
  async getGroup(id: string): Promise<WalletGroup | null> {
    return walletGroups.get(id) || null;
  }

  /**
   * Update wallet group
   */
  async updateGroup(
    id: string,
    updates: { name?: string; description?: string }
  ): Promise<WalletGroup | null> {
    const group = walletGroups.get(id);
    if (!group) return null;
    
    if (updates.name) group.name = updates.name;
    if (updates.description !== undefined) group.description = updates.description;
    group.updatedAt = Date.now();
    
    return group;
  }

  /**
   * Delete wallet group
   */
  async deleteGroup(id: string): Promise<boolean> {
    return walletGroups.delete(id);
  }

  /**
   * Add wallet to group
   */
  async addWalletToGroup(groupId: string, wallet: string): Promise<WalletGroup | null> {
    const group = walletGroups.get(groupId);
    if (!group) return null;
    
    const normalizedWallet = wallet.toLowerCase();
    if (!group.wallets.includes(normalizedWallet)) {
      group.wallets.push(normalizedWallet);
      group.updatedAt = Date.now();
    }
    
    return group;
  }

  /**
   * Remove wallet from group
   */
  async removeWalletFromGroup(groupId: string, wallet: string): Promise<WalletGroup | null> {
    const group = walletGroups.get(groupId);
    if (!group) return null;
    
    const normalizedWallet = wallet.toLowerCase();
    group.wallets = group.wallets.filter(w => w !== normalizedWallet);
    group.updatedAt = Date.now();
    
    return group;
  }

  /**
   * Get aggregated portfolio for a group
   */
  async getGroupPortfolio(groupId: string): Promise<PortfolioSummary | null> {
    const group = walletGroups.get(groupId);
    if (!group || group.wallets.length === 0) return null;

    // Simulate portfolio data based on wallets
    const holdings = this.generateSimulatedHoldings(group.wallets);
    
    const totalValue = holdings.reduce((sum, h) => sum + h.valueUSD, 0);
    
    // Calculate distributions
    const chainDistribution: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};
    
    holdings.forEach(h => {
      // Chain distribution
      if (!chainDistribution[h.chain]) chainDistribution[h.chain] = 0;
      chainDistribution[h.chain] += h.valueUSD;
      
      // Category distribution
      const category = this.getTokenCategory(h.symbol);
      if (!categoryDistribution[category]) categoryDistribution[category] = 0;
      categoryDistribution[category] += h.valueUSD;
    });

    // Convert to percentages
    Object.keys(chainDistribution).forEach(chain => {
      chainDistribution[chain] = (chainDistribution[chain] / totalValue) * 100;
    });
    Object.keys(categoryDistribution).forEach(cat => {
      categoryDistribution[cat] = (categoryDistribution[cat] / totalValue) * 100;
    });

    return {
      totalValueUSD: totalValue,
      tokenCount: holdings.length,
      chainDistribution,
      categoryDistribution,
      topHoldings: holdings.slice(0, 10),
      change24h: (Math.random() - 0.4) * 10, // -4% to +6%
      change7d: (Math.random() - 0.3) * 20, // -6% to +14%
    };
  }

  /**
   * Get detailed wallet analysis for group
   */
  async getGroupWalletAnalysis(groupId: string): Promise<any | null> {
    const group = walletGroups.get(groupId);
    if (!group) return null;

    const walletAnalysis = group.wallets.map(wallet => {
      const value = Math.random() * 100000;
      return {
        address: wallet,
        valueUSD: value,
        change24h: (Math.random() - 0.4) * 10,
        change7d: (Math.random() - 0.3) * 20,
        tokenCount: Math.floor(Math.random() * 20) + 5,
        topTokens: this.getRandomTokens(3),
        lastActivity: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      };
    });

    return {
      groupId,
      groupName: group.name,
      walletCount: group.wallets.length,
      wallets: walletAnalysis,
      summary: {
        totalValue: walletAnalysis.reduce((sum, w) => sum + w.valueUSD, 0),
        avgValue: walletAnalysis.reduce((sum, w) => sum + w.valueUSD, 0) / walletAnalysis.length,
        totalChange24h: walletAnalysis.reduce((sum, w) => sum + w.change24h * w.valueUSD, 0) / walletAnalysis.reduce((sum, w) => sum + w.valueUSD, 0),
        totalChange7d: walletAnalysis.reduce((sum, w) => sum + w.change7d * w.valueUSD, 0) / walletAnalysis.reduce((sum, w) => sum + w.valueUSD, 0),
      },
    };
  }

  /**
   * Compare two groups
   */
  async compareGroups(groupId1: string, groupId2: string): Promise<any | null> {
    const group1 = await this.getGroupPortfolio(groupId1);
    const group2 = await this.getGroupPortfolio(groupId2);
    
    if (!group1 || !group2) return null;

    return {
      group1: {
        id: groupId1,
        totalValueUSD: group1.totalValueUSD,
        change24h: group1.change24h,
        change7d: group1.change7d,
        tokenCount: group1.tokenCount,
      },
      group2: {
        id: groupId2,
        totalValueUSD: group2.totalValueUSD,
        change24h: group2.change24h,
        change7d: group2.change7d,
        tokenCount: group2.tokenCount,
      },
      comparison: {
        valueDiff: group1.totalValueUSD - group2.totalValueUSD,
        valueDiffPercent: ((group1.totalValueUSD - group2.totalValueUSD) / group2.totalValueUSD) * 100,
        performanceDiff24h: group1.change24h - group2.change24h,
        performanceDiff7d: group1.change7d - group2.change7d,
      },
    };
  }

  /**
   * Get group activity timeline
   */
  async getGroupActivityTimeline(groupId: string, days: number = 30): Promise<any | null> {
    const group = walletGroups.get(groupId);
    if (!group) return null;

    const timeline = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * dayMs);
      timeline.push({
        date: date.toISOString().split('T')[0],
        transactionCount: Math.floor(Math.random() * 50) + 5,
        volumeUSD: Math.random() * 50000 + 5000,
        uniqueWallets: Math.floor(Math.random() * group.wallets.length) + 1,
      });
    }

    return {
      groupId,
      period: days,
      timeline: timeline.reverse(),
      summary: {
        totalTransactions: timeline.reduce((sum, d) => sum + d.transactionCount, 0),
        avgDailyVolume: timeline.reduce((sum, d) => sum + d.volumeUSD, 0) / days,
        activeDays: timeline.filter(d => d.transactionCount > 0).length,
      },
    };
  }

  /**
   * Generate group performance report
   */
  async generateGroupReport(groupId: string): Promise<any | null> {
    const group = walletGroups.get(groupId);
    if (!group) return null;

    const portfolio = await this.getGroupPortfolio(groupId);
    const analysis = await this.getGroupWalletAnalysis(groupId);
    const timeline = await this.getGroupActivityTimeline(groupId, 30);

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        walletCount: group.wallets.length,
        createdAt: group.createdAt,
      },
      portfolio,
      analysis,
      timeline,
      generatedAt: Date.now(),
    };
  }

  // Helper methods
  private generateSimulatedHoldings(wallets: string[]): TokenHolding[] {
    const tokens = Object.keys(tokenPrices);
    const holdings: TokenHolding[] = [];
    
    // Generate random holdings for each wallet
    wallets.forEach((wallet, walletIndex) => {
      const numTokens = Math.floor(Math.random() * 8) + 3;
      const selectedTokens = this.getRandomTokens(numTokens);
      
      selectedTokens.forEach(token => {
        const existing = holdings.find(h => h.symbol === token.symbol);
        const value = Math.random() * 50000;
        
        if (existing) {
          existing.valueUSD += value;
          existing.balance = (parseFloat(existing.balance) + Math.random() * 10).toFixed(6);
        } else {
          holdings.push({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            chain: token.chain,
            balance: (Math.random() * 10).toFixed(6),
            valueUSD: value,
            percentage: 0,
          });
        }
      });
    });

    // Calculate percentages
    const total = holdings.reduce((sum, h) => sum + h.valueUSD, 0);
    holdings.forEach(h => {
      h.percentage = (h.valueUSD / total) * 100;
    });

    // Sort by value
    return holdings.sort((a, b) => b.valueUSD - a.valueUSD);
  }

  private getRandomTokens(count: number): any[] {
    const allTokens = [
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chain: 'Ethereum' },
      { symbol: 'BTC', name: 'Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chain: 'Ethereum' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chain: 'Ethereum' },
      { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chain: 'Ethereum' },
      { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', chain: 'Ethereum' },
      { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', chain: 'Ethereum' },
      { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', chain: 'Ethereum' },
      { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3B2d421', chain: 'Ethereum' },
      { symbol: 'SOL', name: 'Solana', address: '0xD31a59c85aE1D6D3B0016a0a4C4eF5b7f3b7b7b7', chain: 'Solana' },
      { symbol: 'MATIC', name: 'Polygon', address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfe9B0', chain: 'Polygon' },
      { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', chain: 'Arbitrum' },
      { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', chain: 'Optimism' },
      { symbol: 'AVAX', name: 'Avalanche', address: '0xA39B223c8C4CC47E42a2dF2dCceBa5A53e3a0d2d', chain: 'Avalanche' },
      { symbol: 'BNB', name: 'BNB', address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', chain: 'BSC' },
    ];
    
    const shuffled = allTokens.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private getTokenCategory(symbol: string): string {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD'];
    if (stablecoins.includes(symbol)) return 'Stablecoins';
    
    const defi = ['UNI', 'AAVE', 'MKR', 'LINK', 'CRV', 'LDO', 'COMP'];
    if (defi.includes(symbol)) return 'DeFi';
    
    const layer1 = ['ETH', 'BTC', 'SOL', 'BNB', 'AVAX', 'MATIC'];
    if (layer1.includes(symbol)) return 'Layer1';
    
    return 'Other';
  }
}

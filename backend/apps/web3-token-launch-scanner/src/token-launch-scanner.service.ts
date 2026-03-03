import { Injectable } from '@nestjs/common';

export interface TokenLaunch {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  deployer: string;
  initialLiquidity: string;
  liquidityToken: string;
  price: string;
  timestamp: number;
  txHash: string;
  holders: number;
  volume24h: string;
  suspicious: boolean;
  riskScore: number;
}

export interface LaunchStats {
  chainId: number;
  totalLaunches: number;
  active24h: number;
  suspiciousCount: number;
  avgLiquidity: string;
}

export interface WatchlistItem {
  id: string;
  address: string;
  name: string;
  addedAt: number;
  notes?: string;
}

@Injectable()
export class TokenLaunchScannerService {
  private launches: Map<number, TokenLaunch[]> = new Map();
  private watchlist: WatchlistItem[] = [];

  constructor() {
    this.initializeLaunchData();
  }

  private initializeLaunchData() {
    // Sample token launch data for demo
    const sampleLaunches: TokenLaunch[] = [
      {
        id: '1',
        name: 'Pepe',
        symbol: 'PEPE',
        address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        chainId: 1,
        deployer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
        initialLiquidity: '5.2',
        liquidityToken: 'WETH',
        price: '0.00000123',
        timestamp: Date.now() - 3600000,
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        holders: 15420,
        volume24h: '1250000',
        suspicious: false,
        riskScore: 25
      },
      {
        id: '2',
        name: 'Arbitrum',
        symbol: 'ARB',
        address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        chainId: 42161,
        deployer: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
        initialLiquidity: '150',
        liquidityToken: 'ETH',
        price: '1.25',
        timestamp: Date.now() - 7200000,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        holders: 45230,
        volume24h: '85000000',
        suspicious: false,
        riskScore: 15
      },
      {
        id: '3',
        name: 'Base',
        symbol: 'BASE',
        address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
        chainId: 8453,
        deployer: '0xE37e799D5076792e5833E27306a3F5cC50e3c3Ed',
        initialLiquidity: '2.5',
        liquidityToken: 'ETH',
        price: '2.85',
        timestamp: Date.now() - 1800000,
        txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        holders: 8920,
        volume24h: '4500000',
        suspicious: false,
        riskScore: 20
      },
      {
        id: '4',
        name: 'SuspiciousToken',
        symbol: 'SUSP',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
        deployer: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        initialLiquidity: '0.01',
        liquidityToken: 'WETH',
        price: '0.00000001',
        timestamp: Date.now() - 600000,
        txHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
        holders: 5,
        volume24h: '100',
        suspicious: true,
        riskScore: 95
      },
      {
        id: '5',
        name: 'Optimism',
        symbol: 'OP',
        address: '0x4200000000000000000000000000000000000042',
        chainId: 10,
        deployer: '0xACa94C352e5b10b5E89E7b8F0d8B9C0D1E2F3A4B',
        initialLiquidity: '500',
        liquidityToken: 'ETH',
        price: '3.45',
        timestamp: Date.now() - 14400000,
        txHash: '0x111222333444555666777888999aaabbbcccddd',
        holders: 32100,
        volume24h: '45000000',
        suspicious: false,
        riskScore: 10
      }
    ];

    // Add sample launches for different chains
    this.launches.set(1, sampleLaunches.filter(l => l.chainId === 1));
    this.launches.set(42161, sampleLaunches.filter(l => l.chainId === 42161));
    this.launches.set(8453, sampleLaunches.filter(l => l.chainId === 8453));
    this.launches.set(10, sampleLaunches.filter(l => l.chainId === 10));
    this.launches.set(137, sampleLaunches.filter(l => l.chainId === 137));
    this.launches.set(56, sampleLaunches.filter(l => l.chainId === 56));
  }

  async getRecentLaunches(
    chainId?: number,
    limit: number = 20,
    suspicious?: boolean
  ): Promise<TokenLaunch[]> {
    let allLaunches: TokenLaunch[] = [];

    if (chainId) {
      allLaunches = this.launches.get(chainId) || [];
    } else {
      // Get launches from all chains
      for (const launches of this.launches.values()) {
        allLaunches = allLaunches.concat(launches);
      }
    }

    // Filter by suspicious if specified
    if (suspicious !== undefined) {
      allLaunches = allLaunches.filter(l => l.suspicious === suspicious);
    }

    // Sort by timestamp (newest first)
    allLaunches.sort((a, b) => b.timestamp - a.timestamp);

    return allLaunches.slice(0, limit);
  }

  async getLaunchDetails(address: string, chainId: number): Promise<TokenLaunch | null> {
    const launches = this.launches.get(chainId) || [];
    return launches.find(l => l.address.toLowerCase() === address.toLowerCase()) || null;
  }

  async getLaunchStats(chainId?: number): Promise<LaunchStats[]> {
    const stats: LaunchStats[] = [];
    const chainIds = chainId ? [chainId] : Array.from(this.launches.keys());

    for (const cid of chainIds) {
      const launches = this.launches.get(cid) || [];
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;

      const active24h = launches.filter(l => l.timestamp > dayAgo).length;
      const suspiciousCount = launches.filter(l => l.suspicious).length;
      const totalLiquidity = launches.reduce((sum, l) => sum + parseFloat(l.initialLiquidity), 0);
      const avgLiquidity = launches.length > 0 ? (totalLiquidity / launches.length).toFixed(2) : '0';

      stats.push({
        chainId: cid,
        totalLaunches: launches.length,
        active24h,
        suspiciousCount,
        avgLiquidity
      });
    }

    return stats;
  }

  async getTrendingLaunches(chainId?: number, limit: number = 10): Promise<TokenLaunch[]> {
    const launches = await this.getRecentLaunches(chainId, 50);
    
    // Sort by volume and holder count
    return launches
      .filter(l => !l.suspicious)
      .sort((a, b) => {
        const scoreA = parseFloat(a.volume24h) * a.holders;
        const scoreB = parseFloat(b.volume24h) * b.holders;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  async getSuspiciousLaunches(chainId?: number, limit: number = 20): Promise<TokenLaunch[]> {
    return this.getRecentLaunches(chainId, limit, true);
  }

  // Watchlist management
  async addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): Promise<WatchlistItem> {
    const newItem: WatchlistItem = {
      id: `wl-${Date.now()}`,
      ...item,
      addedAt: Date.now()
    };
    this.watchlist.push(newItem);
    return newItem;
  }

  async removeFromWatchlist(id: string): Promise<boolean> {
    const index = this.watchlist.findIndex(item => item.id === id);
    if (index > -1) {
      this.watchlist.splice(index, 1);
      return true;
    }
    return false;
  }

  async getWatchlist(): Promise<WatchlistItem[]> {
    return this.watchlist;
  }

  // Analyze token for risks
  async analyzeTokenRisks(address: string, chainId: number): Promise<{
    score: number;
    factors: string[];
    recommendation: string;
  }> {
    const launch = await this.getLaunchDetails(address, chainId);
    
    if (!launch) {
      return {
        score: 0,
        factors: ['Token not found'],
        recommendation: 'Unknown token'
      };
    }

    const factors: string[] = [];
    let riskScore = 0;

    // Check holder count
    if (launch.holders < 10) {
      riskScore += 30;
      factors.push('Very low holder count (<10)');
    } else if (launch.holders < 100) {
      riskScore += 15;
      factors.push('Low holder count (<100)');
    }

    // Check liquidity
    if (parseFloat(launch.initialLiquidity) < 1) {
      riskScore += 25;
      factors.push('Very low initial liquidity');
    } else if (parseFloat(launch.initialLiquidity) < 5) {
      riskScore += 10;
      factors.push('Low initial liquidity');
    }

    // Check volume
    if (parseFloat(launch.volume24h) < 1000) {
      riskScore += 20;
      factors.push('Very low 24h volume');
    }

    // Check for suspicious flags
    if (launch.suspicious) {
      riskScore += 30;
      factors.push('Flagged as suspicious');
    }

    // Cap at 100
    riskScore = Math.min(100, riskScore);

    let recommendation: string;
    if (riskScore < 30) {
      recommendation = 'Low risk - normal token launch';
    } else if (riskScore < 60) {
      recommendation = 'Medium risk - exercise caution';
    } else {
      recommendation = 'High risk - potential scam, do not invest';
    }

    return {
      score: riskScore,
      factors,
      recommendation
    };
  }

  // Get chain name
  getChainName(chainId: number): string {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BSC',
      8453: 'Base',
      43114: 'Avalanche'
    };
    return chains[chainId] || `Chain ${chainId}`;
  }
}

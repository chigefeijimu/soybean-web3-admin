import { Injectable } from '@nestjs/common';

// Marketplace royalty info
interface MarketplaceInfo {
  name: string;
  defaultRoyalty: number;
  maxRoyalty: number;
  chains: string[];
}

// Collection royalty data
interface RoyaltyData {
  collectionAddress: string;
  chain: string;
  name: string;
  totalVolume: number;
  totalRoyalties: number;
  royaltyPercentage: number;
  royaltyEarned: number;
  lastSaleVolume: number;
  lastSaleRoyalties: number;
  salesCount: number;
  lastUpdated: number;
}

// Royalty history entry
interface RoyaltyHistoryEntry {
  date: string;
  volume: number;
  royalties: number;
  salesCount: number;
}

// Alert configuration
interface Alert {
  id: string;
  collectionAddress: string;
  chain: string;
  threshold: number;
  type: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}

// Tracked collection
interface TrackedCollection {
  address: string;
  chain: string;
  name: string;
  addedAt: number;
  royaltyPercentage: number;
  creatorAddress: string;
}

@Injectable()
export class AppService {
  private readonly marketplaces: MarketplaceInfo[] = [
    { name: 'OpenSea', defaultRoyalty: 2.5, maxRoyalty: 10, chains: ['ethereum', 'polygon'] },
    { name: 'Blur', defaultRoyalty: 0, maxRoyalty: 2.5, chains: ['ethereum'] },
    { name: 'LooksRare', defaultRoyalty: 2, maxRoyalty: 10, chains: ['ethereum'] },
    { name: 'X2Y2', defaultRoyalty: 2.5, maxRoyalty: 5, chains: ['ethereum'] },
    { name: 'Foundation', defaultRoyalty: 10, maxRoyalty: 10, chains: ['ethereum'] },
    { name: 'Async', defaultRoyalty: 2.5, maxRoyalty: 10, chains: ['ethereum', 'polygon'] },
    { name: 'Zora', defaultRoyalty: 5, maxRoyalty: 10, chains: ['ethereum', 'base'] },
    { name: 'Reservoir', defaultRoyalty: 0, maxRoyalty: 10, chains: ['ethereum', 'polygon', 'arbitrum', 'optimism'] },
    { name: 'MagicEden', defaultRoyalty: 2, maxRoyalty: 5, chains: ['solana'] },
    { name: 'Tensor', defaultRoyalty: 0, maxRoyalty: 2, chains: ['solana'] },
  ];

  // Mock tracked collections
  private trackedCollections: TrackedCollection[] = [
    { address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', chain: 'ethereum', name: 'Bored Ape Yacht Club', addedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, royaltyPercentage: 2.5, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
    { address: '0x23581767a106ae21c074b2276d25e5cc3a6ae32', chain: 'ethereum', name: 'Azuki', addedAt: Date.now() - 25 * 24 * 60 * 60 * 1000, royaltyPercentage: 5, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
    { address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b', chain: 'ethereum', name: 'Clone X', addedAt: Date.now() - 20 * 24 * 60 * 60 * 1000, royaltyPercentage: 10, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
    { address: '0x8a90cab2b38dba80c64b7734e58e1cdb38b8992e', chain: 'ethereum', name: 'Doodle', addedAt: Date.now() - 15 * 24 * 60 * 60 * 1000, royaltyPercentage: 5, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
    { address: '0xed5af388653567af2f388e6224dc7c4b3241c544', chain: 'ethereum', name: 'Adidas Originals', addedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, royaltyPercentage: 10, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
    { address: '0x7bd29408f11d2bfc23c34f18275bbfcbb0d4f46d', chain: 'ethereum', name: 'Milady Maker', addedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, royaltyPercentage: 0, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
    { address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb', chain: 'ethereum', name: 'CryptoPunks', addedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, royaltyPercentage: 0, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
    { address: '0x4e1f6d4ed0b7b82a3b6e1b3a3d1e2c9f4b8c5d6e', chain: 'polygon', name: 'Polygon Punks', addedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, royaltyPercentage: 5, creatorAddress: '0x000000000000000000000000000000000000dEaD' },
  ];

  // Mock alerts
  private alerts: Alert[] = [];

  // Generate realistic mock data for collections
  private generateRoyaltyData(collectionAddress: string, chain: string): RoyaltyData {
    const collection = this.trackedCollections.find(
      c => c.address.toLowerCase() === collectionAddress.toLowerCase() && c.chain === chain
    );
    
    // Generate realistic data based on collection
    const hash = collectionAddress.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const baseVolume = Math.abs(hash % 10000000) + 100000;
    const royaltyRate = collection?.royaltyPercentage || 2.5;
    const salesCount = Math.floor(Math.abs(hash % 5000)) + 100;
    
    const totalVolume = baseVolume;
    const totalRoyalties = (totalVolume * royaltyRate) / 100;
    const lastSaleVolume = (Math.abs(hash % 100) + 1) * 100;
    const lastSaleRoyalties = (lastSaleVolume * royaltyRate) / 100;

    return {
      collectionAddress,
      chain,
      name: collection?.name || `Collection ${collectionAddress.slice(0, 8)}`,
      totalVolume,
      totalRoyalties,
      royaltyPercentage: royaltyRate,
      royaltyEarned: totalRoyalties,
      lastSaleVolume,
      lastSaleRoyalties,
      salesCount,
      lastUpdated: Date.now(),
    };
  }

  // Generate mock history data
  private generateRoyaltyHistory(period: string): RoyaltyHistoryEntry[] {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const history: RoyaltyHistoryEntry[] = [];
    const now = Date.now();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayHash = date.getDate() + date.getMonth() * 31;
      const volume = (Math.abs(dayHash % 100) + 10) * 1000;
      const salesCount = Math.floor(Math.abs(dayHash % 50)) + 5;
      
      history.push({
        date: date.toISOString().split('T')[0],
        volume,
        royalties: volume * 0.05, // 5% average royalty
        salesCount,
      });
    }
    
    return history;
  }

  getHello(): string {
    return 'NFT Royalty Tracker API is running!';
  }

  async getRoyaltyStats(collectionAddress: string, chain: string) {
    const data = this.generateRoyaltyData(collectionAddress, chain);
    return {
      success: true,
      data,
    };
  }

  async getRoyaltyHistory(collectionAddress: string, chain: string, period: string) {
    const history = this.generateRoyaltyHistory(period);
    const total = history.reduce((acc, h) => ({
      volume: acc.volume + h.volume,
      royalties: acc.royalties + h.royalties,
      salesCount: acc.salesCount + h.salesCount,
    }), { volume: 0, royalties: 0, salesCount: 0 });

    return {
      success: true,
      data: {
        period,
        chain,
        collectionAddress,
        history,
        totals: total,
      },
    };
  }

  async getCreatorTotalRoyalties(creatorAddress: string, chains: string) {
    const chainList = chains.split(',');
    const results = this.trackedCollections
      .filter(c => chainList.includes(c.chain))
      .map(c => this.generateRoyaltyData(c.address, c.chain));
    
    const total = results.reduce((acc, r) => ({
      volume: acc.volume + r.totalVolume,
      royalties: acc.royalties + r.totalRoyalties,
      salesCount: acc.salesCount + r.salesCount,
    }), { volume: 0, royalties: 0, salesCount: 0 });

    return {
      success: true,
      data: {
        creatorAddress,
        collections: results.length,
        chains: chainList,
        totalVolume: total.volume,
        totalRoyalties: total.royalties,
        totalSalesCount: total.salesCount,
        collectionsBreakdown: results,
      },
    };
  }

  async getTrackedCollections(page: number, pageSize: number, sortBy: string, order: 'asc' | 'desc') {
    let collections = this.trackedCollections.map(c => this.generateRoyaltyData(c.address, c.chain));
    
    // Sort
    collections.sort((a, b) => {
      const aVal = a[sortBy as keyof RoyaltyData] as number;
      const bVal = b[sortBy as keyof RoyaltyData] as number;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate
    const start = (page - 1) * pageSize;
    const paged = collections.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        items: paged,
        page,
        pageSize,
        total: collections.length,
        totalPages: Math.ceil(collections.length / pageSize),
      },
    };
  }

  async addCollection(collectionAddress: string, chain: string, name?: string) {
    const exists = this.trackedCollections.find(
      c => c.address.toLowerCase() === collectionAddress.toLowerCase() && c.chain === chain
    );
    
    if (exists) {
      return { success: false, message: 'Collection already tracked' };
    }

    const newCollection: TrackedCollection = {
      address: collectionAddress,
      chain,
      name: name || `Collection ${collectionAddress.slice(0, 8)}`,
      addedAt: Date.now(),
      royaltyPercentage: 2.5,
      creatorAddress: '0x000000000000000000000000000000000000dEaD',
    };

    this.trackedCollections.push(newCollection);
    
    return {
      success: true,
      data: newCollection,
    };
  }

  async removeCollection(collectionAddress: string, chain: string) {
    const index = this.trackedCollections.findIndex(
      c => c.address.toLowerCase() === collectionAddress.toLowerCase() && c.chain === chain
    );
    
    if (index === -1) {
      return { success: false, message: 'Collection not found' };
    }

    this.trackedCollections.splice(index, 1);
    
    return { success: true, message: 'Collection removed' };
  }

  async getRoyaltyBreakdown(collectionAddress: string, chain: string) {
    const marketplaces = this.marketplaces.filter(m => m.chains.includes(chain));
    
    const breakdown = marketplaces.map(m => {
      const hash = collectionAddress.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
      const volume = Math.abs(hash % 100000) + 1000;
      const royalty = (volume * m.defaultRoyalty) / 100;
      
      return {
        marketplace: m.name,
        volume,
        royaltyEarned: royalty,
        royaltyRate: m.defaultRoyalty,
        maxRate: m.maxRoyalty,
        transactions: Math.floor(Math.abs(hash % 100)) + 10,
      };
    });

    const total = breakdown.reduce((acc, b) => ({
      volume: acc.volume + b.volume,
      royalty: acc.royalty + b.royaltyEarned,
      transactions: acc.transactions + b.transactions,
    }), { volume: 0, royalty: 0, transactions: 0 });

    return {
      success: true,
      data: {
        collectionAddress,
        chain,
        breakdown,
        totals: total,
      },
    };
  }

  async getTopRoyaltyEarners(period: string, limit: number) {
    const earners = this.trackedCollections
      .map(c => {
        const data = this.generateRoyaltyData(c.address, c.chain);
        return {
          rank: 0,
          collectionAddress: c.address,
          chain: c.chain,
          name: c.name,
          totalRoyalties: data.totalRoyalties,
          totalVolume: data.totalVolume,
          royaltyRate: c.royaltyPercentage,
          salesCount: data.salesCount,
        };
      })
      .sort((a, b) => b.totalRoyalties - a.totalRoyalties)
      .slice(0, limit)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return {
      success: true,
      data: {
        period,
        totalEarnings: earners.reduce((a, e) => a + e.totalRoyalties, 0),
        earners,
      },
    };
  }

  async getMarketplaces() {
    return {
      success: true,
      data: this.marketplaces.map(m => ({
        name: m.name,
        defaultRoyalty: m.defaultRoyalty,
        maxRoyalty: m.maxRoyalty,
        supportedChains: m.chains,
      })),
    };
  }

  async setRoyaltyAlert(body: { collectionAddress: string; chain: string; threshold: number; type: 'above' | 'below' }) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      collectionAddress: body.collectionAddress,
      chain: body.chain,
      threshold: body.threshold,
      type: body.type,
      createdAt: Date.now(),
      triggered: false,
    };

    this.alerts.push(alert);

    return {
      success: true,
      data: alert,
    };
  }

  async getAlerts(address?: string) {
    const alerts = address 
      ? this.alerts.filter(a => a.collectionAddress.toLowerCase() === address.toLowerCase())
      : this.alerts;

    return {
      success: true,
      data: alerts,
    };
  }

  async deleteAlert(id: string) {
    const index = this.alerts.findIndex(a => a.id === id);
    
    if (index === -1) {
      return { success: false, message: 'Alert not found' };
    }

    this.alerts.splice(index, 1);
    
    return { success: true, message: 'Alert deleted' };
  }

  async getDashboardStats() {
    const totalCollections = this.trackedCollections.length;
    const totalRoyalties = this.trackedCollections.reduce((acc, c) => {
      const data = this.generateRoyaltyData(c.address, c.chain);
      return acc + data.totalRoyalties;
    }, 0);
    
    const totalVolume = this.trackedCollections.reduce((acc, c) => {
      const data = this.generateRoyaltyData(c.address, c.chain);
      return acc + data.totalVolume;
    }, 0);

    const chainStats = ['ethereum', 'polygon', 'arbitrum'].map(chain => {
      const chainCollections = this.trackedCollections.filter(c => c.chain === chain);
      return {
        chain,
        collections: chainCollections.length,
        volume: chainCollections.reduce((acc, c) => {
          const data = this.generateRoyaltyData(c.address, c.chain);
          return acc + data.totalVolume;
        }, 0),
        royalties: chainCollections.reduce((acc, c) => {
          const data = this.generateRoyaltyData(c.address, c.chain);
          return acc + data.totalRoyalties;
        }, 0),
      };
    });

    return {
      success: true,
      data: {
        totalCollections,
        totalRoyalties,
        totalVolume,
        averageRoyaltyRate: 4.2,
        chainStats,
        recentAlerts: this.alerts.slice(-5),
      },
    };
  }

  async searchCollections(query: string) {
    const results = this.trackedCollections
      .filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.address.toLowerCase().includes(query.toLowerCase()))
      .map(c => this.generateRoyaltyData(c.address, c.chain));

    return {
      success: true,
      data: results,
    };
  }

  async getCollectionDetails(collectionAddress: string, chain: string) {
    const collection = this.trackedCollections.find(
      c => c.address.toLowerCase() === collectionAddress.toLowerCase() && c.chain === chain
    );
    
    const data = this.generateRoyaltyData(collectionAddress, chain);
    const history = this.generateRoyaltyHistory('30d');

    return {
      success: true,
      data: {
        ...data,
        creatorAddress: collection?.creatorAddress || '0x000000000000000000000000000000000000dEaD',
        addedAt: collection?.addedAt || Date.now(),
        supportedMarketplaces: this.marketplaces.filter(m => m.chains.includes(chain)).map(m => m.name),
        history: history.slice(-7), // Last 7 days
      },
    };
  }

  async exportRoyalties(collectionAddress: string, chain: string, format: string) {
    const history = this.generateRoyaltyHistory('30d');
    
    if (format === 'csv') {
      const csv = 'Date,Volume,Royalties,Sales\n' + 
        history.map(h => `${h.date},${h.volume},${h.royalties},${h.salesCount}`).join('\n');
      
      return {
        success: true,
        data: {
          format: 'csv',
          content: csv,
          filename: `royalties_${collectionAddress}_${chain}_${Date.now()}.csv`,
        },
      };
    }

    return {
      success: true,
      data: {
        format: 'json',
        content: history,
        filename: `royalties_${collectionAddress}_${chain}_${Date.now()}.json`,
      },
    };
  }
}

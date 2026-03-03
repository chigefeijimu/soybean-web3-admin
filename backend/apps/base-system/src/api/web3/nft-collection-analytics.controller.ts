import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  totalSupply: number;
  holderCount: number;
  floorPrice: number;
  floorPriceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  sales24h: number;
  avgPrice24h: number;
  marketCap: number;
  traits: NFTAttribute[];
  owners: NFTOwner[];
  transfers: NFTTransfer[];
  historicalData: HistoricalDataPoint[];
}

interface NFTAttribute {
  trait_type: string;
  value: string;
  count: number;
  rarity: number;
}

interface NFTOwner {
  address: string;
  balance: number;
  percentage: number;
}

interface NFTTransfer {
  hash: string;
  from: string;
  to: string;
  tokenId: string;
  price: number;
  timestamp: number;
}

interface HistoricalDataPoint {
  date: string;
  floorPrice: number;
  volume: number;
  sales: number;
}

interface RarityScore {
  tokenId: string;
  score: number;
  rank: number;
  traits: { trait: string; value: string; rarity: number }[];
}

interface CollectionSearchResult {
  collections: NFTCollection[];
  total: number;
  hasMore: boolean;
}

@Controller('nft-collection-analytics')
export class NftCollectionAnalyticsController {
  private readonly alchemyApiKeys: Record<string, string> = {
    eth: process.env.ALCHEMY_ETH_KEY || 'demo',
    polygon: process.env.ALCHEMY_POLYGON_KEY || 'demo',
    arbitrum: process.env.ALCHEMY_ARBITRUM_KEY || 'demo',
    optimism: process.env.ALCHEMY_OPTIMISM_KEY || 'demo',
    base: process.env.ALCHEMY_BASE_KEY || 'demo',
  };

  private readonly openseaApiKey = process.env.OPENSEA_API_KEY || 'demo';

  // Mock data for demonstration
  private readonly mockCollections: NFTCollection[] = [
    {
      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'Bored Ape Yacht Club',
      symbol: 'BAYC',
      chain: 'ethereum',
      totalSupply: 10000,
      holderCount: 6428,
      floorPrice: 18.5,
      floorPriceChange24h: 2.3,
      volume24h: 1250.5,
      volumeChange24h: 15.2,
      sales24h: 68,
      avgPrice24h: 18.39,
      marketCap: 185000,
      traits: [
        { trait_type: 'Background', value: 'Orange', count: 1200, rarity: 12.0 },
        { trait_type: 'Fur', value: 'Dark Brown', count: 800, rarity: 8.0 },
        { trait_type: 'Eyes', value: 'Bored', count: 2500, rarity: 25.0 },
        { trait_type: 'Clothing', value: 'Blue Dress', count: 150, rarity: 1.5 },
      ],
      owners: [
        { address: '0x1a2b3c4d5e6f...', balance: 10, percentage: 0.1 },
        { address: '0x2b3c4d5e6f7a...', balance: 8, percentage: 0.08 },
      ],
      transfers: [
        { hash: '0x1234...', from: '0xabcd...', to: '0xefgh...', tokenId: '1234', price: 18.5, timestamp: Date.now() - 3600000 },
      ],
      historicalData: this.generateHistoricalData(),
    },
    {
      address: '0x23589497bc4bb2de4553c74c288c13b9fe3e80d1',
      name: 'CryptoPunks',
      symbol: 'PUNK',
      chain: 'ethereum',
      totalSupply: 10000,
      holderCount: 3612,
      floorPrice: 45.2,
      floorPriceChange24h: -1.2,
      volume24h: 890.3,
      volumeChange24h: -5.8,
      sales24h: 20,
      avgPrice24h: 44.52,
      marketCap: 452000,
      traits: [
        { trait_type: 'Type', value: 'Alien', count: 9, rarity: 0.09 },
        { trait_type: 'Accessory', value: 'Cap', count: 350, rarity: 3.5 },
      ],
      owners: [],
      transfers: [],
      historicalData: this.generateHistoricalData(),
    },
    {
      address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
      name: 'Clone X',
      symbol: 'CLONE',
      chain: 'ethereum',
      totalSupply: 20000,
      holderCount: 11245,
      floorPrice: 3.2,
      floorPriceChange24h: 5.7,
      volume24h: 456.8,
      volumeChange24h: 22.1,
      sales24h: 142,
      avgPrice24h: 3.22,
      marketCap: 64000,
      traits: [],
      owners: [],
      transfers: [],
      historicalData: this.generateHistoricalData(),
    },
    {
      address: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
      name: 'Pudgy Penguins',
      symbol: 'PPG',
      chain: 'ethereum',
      totalSupply: 8888,
      holderCount: 5234,
      floorPrice: 2.8,
      floorPriceChange24h: 1.1,
      volume24h: 234.5,
      volumeChange24h: 8.3,
      sales24h: 84,
      avgPrice24h: 2.79,
      marketCap: 24886,
      traits: [],
      owners: [],
      transfers: [],
      historicalData: this.generateHistoricalData(),
    },
    {
      address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
      name: 'Azuki',
      symbol: 'AZUKI',
      chain: 'ethereum',
      totalSupply: 10000,
      holderCount: 5823,
      floorPrice: 8.5,
      floorPriceChange24h: -3.2,
      volume24h: 567.2,
      volumeChange24h: -12.5,
      sales24h: 67,
      avgPrice24h: 8.47,
      marketCap: 85000,
      traits: [],
      owners: [],
      transfers: [],
      historicalData: this.generateHistoricalData(),
    },
    {
      address: '0x8a90cab2b38dba80c64b7734e58e1dc38f7ba295',
      name: 'Moonbirds',
      symbol: 'MOON',
      chain: 'ethereum',
      totalSupply: 10000,
      holderCount: 4123,
      floorPrice: 1.9,
      floorPriceChange24h: 0.5,
      volume24h: 123.4,
      volumeChange24h: 3.2,
      sales24h: 65,
      avgPrice24h: 1.9,
      marketCap: 19000,
      traits: [],
      owners: [],
      transfers: [],
      historicalData: this.generateHistoricalData(),
    },
    {
      address: '0x4e1f41613c9084fdc9a86197f71c7b8fe7be9199',
      name: 'DeGods',
      symbol: 'DEGOD',
      chain: 'ethereum',
      totalSupply: 10000,
      holderCount: 3201,
      floorPrice: 1250,
      floorPriceChange24h: 8.9,
      volume24h: 45678,
      volumeChange24h: 35.2,
      sales24h: 37,
      avgPrice24h: 1234.5,
      marketCap: 12500000,
      traits: [],
      owners: [],
      transfers: [],
      historicalData: this.generateHistoricalData(),
    },
    {
      address: '0x593a1054e4b8199302a09b9e2a3c6a0a8c7f8c2d',
      name: 'Milady',
      symbol: 'LADY',
      chain: 'ethereum',
      totalSupply: 10000,
      holderCount: 4521,
      floorPrice: 0.85,
      floorPriceChange24h: -2.1,
      volume24h: 89.3,
      volumeChange24h: -8.5,
      sales24h: 105,
      avgPrice24h: 0.85,
      marketCap: 8500,
      traits: [],
      owners: [],
      transfers: [],
      historicalData: this.generateHistoricalData(),
    },
  ];

  private generateHistoricalData(): HistoricalDataPoint[] {
    const data: HistoricalDataPoint[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      const basePrice = 15 + Math.random() * 10;
      const volume = 500 + Math.random() * 1000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        floorPrice: parseFloat(basePrice.toFixed(2)),
        volume: parseFloat(volume.toFixed(2)),
        sales: Math.floor(20 + Math.random() * 50),
      });
    }
    return data;
  }

  @Get('collections')
  async getCollections(
    @Query('chain') chain: string = 'ethereum',
    @Query('sort') sort: string = 'volume',
    @Query('order') order: string = 'desc',
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ): Promise<CollectionSearchResult> {
    let collections = [...this.mockCollections];
    
    // Filter by chain
    if (chain && chain !== 'all') {
      collections = collections.filter(c => c.chain === chain);
    }
    
    // Sort
    const sortKey = sort as keyof NFTCollection;
    collections.sort((a, b) => {
      const aVal = a[sortKey] as number;
      const bVal = b[sortKey] as number;
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    // Paginate
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;
    const paginated = collections.slice(offsetNum, offsetNum + limitNum);
    
    return {
      collections: paginated,
      total: collections.length,
      hasMore: offsetNum + limitNum < collections.length,
    };
  }

  @Get('collection/:address')
  async getCollection(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ): Promise<NFTCollection> {
    const collection = this.mockCollections.find(
      c => c.address.toLowerCase() === address.toLowerCase() || 
           c.name.toLowerCase().includes(address.toLowerCase())
    );
    
    if (!collection) {
      // Return a default collection for any address
      return {
        address: address,
        name: 'Unknown Collection',
        symbol: 'UNKNOWN',
        chain,
        totalSupply: Math.floor(Math.random() * 10000) + 1000,
        holderCount: Math.floor(Math.random() * 5000) + 500,
        floorPrice: parseFloat((Math.random() * 10).toFixed(2)),
        floorPriceChange24h: parseFloat((Math.random() * 10 - 5).toFixed(2)),
        volume24h: parseFloat((Math.random() * 500).toFixed(2)),
        volumeChange24h: parseFloat((Math.random() * 20 - 10).toFixed(2)),
        sales24h: Math.floor(Math.random() * 100),
        avgPrice24h: parseFloat((Math.random() * 10).toFixed(2)),
        marketCap: parseFloat((Math.random() * 100000).toFixed(2)),
        traits: this.generateMockTraits(),
        owners: this.generateMockOwners(),
        transfers: this.generateMockTransfers(),
        historicalData: this.generateHistoricalData(),
      };
    }
    
    return collection;
  }

  @Get('collection/:address/rarity')
  async getRarity(
    @Param('address') address: string,
    @Query('tokenId') tokenId?: string,
  ): Promise<{ rarities: RarityScore[] }> {
    const rarities: RarityScore[] = [];
    
    // Generate mock rarity data for tokens
    const tokenCount = tokenId ? 1 : 20;
    const tokens = tokenId ? [tokenId] : Array.from({ length: tokenCount }, (_, i) => String(i + 1));
    
    tokens.forEach((id, index) => {
      const traits = this.generateMockTraits().map(t => ({
        trait: t.trait_type,
        value: t.value,
        rarity: t.rarity,
      }));
      
      const score = traits.reduce((sum, t) => sum + t.rarity, 0);
      
      rarities.push({
        tokenId: id,
        score: parseFloat(score.toFixed(2)),
        rank: index + 1,
        traits,
      });
    });
    
    // Sort by score descending
    rarities.sort((a, b) => b.score - a.score);
    
    // Update ranks after sorting
    rarities.forEach((r, i) => r.rank = i + 1);
    
    return { rarities };
  }

  @Get('collection/:address/holders')
  async getHolders(
    @Param('address') address: string,
    @Query('limit') limit: string = '50',
  ): Promise<{ holders: NFTOwner[] }> {
    return {
      holders: this.generateMockOwners(parseInt(limit) || 50),
    };
  }

  @Get('collection/:address/transfers')
  async getTransfers(
    @Param('address') address: string,
    @Query('limit') limit: string = '50',
  ): Promise<{ transfers: NFTTransfer[] }> {
    return {
      transfers: this.generateMockTransfers(parseInt(limit) || 50),
    };
  }

  @Get('collection/:address/history')
  async getHistory(
    @Param('address') address: string,
    @Query('range') range: string = '30d',
  ): Promise<{ historicalData: HistoricalDataPoint[] }> {
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;
    else if (range === '1y') days = 365;
    
    const data: HistoricalDataPoint[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      const basePrice = 15 + Math.sin(i / 5) * 5 + Math.random() * 3;
      const volume = 500 + Math.cos(i / 3) * 200 + Math.random() * 300;
      
      data.push({
        date: date.toISOString().split('T')[0],
        floorPrice: parseFloat(Math.max(basePrice, 1).toFixed(2)),
        volume: parseFloat(volume.toFixed(2)),
        sales: Math.floor(20 + Math.random() * 50),
      });
    }
    
    return { historicalData: data };
  }

  @Post('collection/:address/analytics')
  async getAnalytics(
    @Param('address') address: string,
    @Body() body: { metrics?: string[] },
  ): Promise<{
    collection: NFTCollection;
    analytics: {
      trend: 'bullish' | 'bearish' | 'neutral';
      volatility: number;
      confidence: number;
      prediction: {
        floorPrice7d: number;
        volume7d: number;
      };
      insights: string[];
    };
  }> {
    const collection = await this.getCollection(address, body['chain'] || 'ethereum');
    
    const trendValue = collection.floorPriceChange24h > 2 ? 'bullish' : 
             collection.floorPriceChange24h < -2 ? 'bearish' : 'neutral';
    
    const analytics = {
      trend: trendValue as 'bullish' | 'bearish' | 'neutral',
      volatility: parseFloat((Math.random() * 30 + 10).toFixed(2)),
      confidence: parseFloat((Math.random() * 20 + 75).toFixed(2)),
      prediction: {
        floorPrice7d: parseFloat((collection.floorPrice * (1 + (Math.random() - 0.5) * 0.2)).toFixed(2)),
        volume7d: parseFloat((collection.volume24h * (1 + (Math.random() - 0.5) * 0.3)).toFixed(2)),
      },
      insights: [
        `Floor price ${collection.floorPriceChange24h > 0 ? 'up' : 'down'} ${Math.abs(collection.floorPriceChange24h).toFixed(1)}% in 24h`,
        `${collection.sales24h} sales in the last 24 hours`,
        `${collection.holderCount} unique holders`,
      ],
    };
    
    return { collection, analytics };
  }

  @Get('trending')
  async getTrending(
    @Query('chain') chain: string = 'all',
    @Query('timeframe') timeframe: string = '24h',
  ): Promise<{
    trending: {
      collection: NFTCollection;
      score: number;
    }[];
  }> {
    let collections = [...this.mockCollections];
    
    if (chain && chain !== 'all') {
      collections = collections.filter(c => c.chain === chain);
    }
    
    // Calculate trending score based on volume change and price change
    const trending = collections.map(c => ({
      collection: c,
      score: c.volumeChange24h + c.floorPriceChange24h * 2,
    })).sort((a, b) => b.score - a.score).slice(0, 10);
    
    return { trending };
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('chain') chain: string = 'all',
  ): Promise<CollectionSearchResult> {
    if (!query) {
      return { collections: [], total: 0, hasMore: false };
    }
    
    let collections = this.mockCollections.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.symbol.toLowerCase().includes(query.toLowerCase())
    );
    
    if (chain && chain !== 'all') {
      collections = collections.filter(c => c.chain === chain);
    }
    
    return {
      collections,
      total: collections.length,
      hasMore: false,
    };
  }

  @Get('chains')
  async getChains(): Promise<{
    chains: { id: string; name: string; nftCount: number }[];
  }> {
    return {
      chains: [
        { id: 'ethereum', name: 'Ethereum', nftCount: 12450000 },
        { id: 'polygon', name: 'Polygon', nftCount: 8900000 },
        { id: 'arbitrum', name: 'Arbitrum', nftCount: 2100000 },
        { id: 'optimism', name: 'Optimism', nftCount: 1200000 },
        { id: 'base', name: 'Base', nftCount: 3500000 },
        { id: 'solana', name: 'Solana', nftCount: 5200000 },
      ],
    };
  }

  private generateMockTraits(): NFTAttribute[] {
    const traitTypes = ['Background', 'Fur', 'Eyes', 'Clothing', 'Hat', 'Accessory'];
    const values = ['Blue', 'Red', 'Green', 'Dark', 'Light', 'Orange', 'Purple'];
    
    return traitTypes.map(trait => ({
      trait_type: trait,
      value: values[Math.floor(Math.random() * values.length)],
      count: Math.floor(Math.random() * 1000) + 100,
      rarity: parseFloat((Math.random() * 20 + 1).toFixed(2)),
    }));
  }

  private generateMockOwners(count: number = 20): NFTOwner[] {
    const owners: NFTOwner[] = [];
    let remaining = 100;
    
    for (let i = 0; i < count; i++) {
      const balance = i === count - 1 ? remaining : Math.floor(Math.random() * remaining * 0.3) + 1;
      remaining -= balance;
      
      owners.push({
        address: `0x${Math.random().toString(16).slice(2, 14)}...${Math.random().toString(16).slice(2, 6)}`,
        balance,
        percentage: parseFloat((balance / 100).toFixed(2)),
      });
    }
    
    return owners;
  }

  private generateMockTransfers(count: number = 20): NFTTransfer[] {
    const transfers: NFTTransfer[] = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
      transfers.push({
        hash: `0x${Math.random().toString(16).slice(2, 18)}...`,
        from: `0x${Math.random().toString(16).slice(2, 14)}...`,
        to: `0x${Math.random().toString(16).slice(2, 14)}...`,
        tokenId: String(Math.floor(Math.random() * 10000)),
        price: parseFloat((Math.random() * 20).toFixed(2)),
        timestamp: now - i * Math.floor(Math.random() * 3600000),
      });
    }
    
    return transfers;
  }
}

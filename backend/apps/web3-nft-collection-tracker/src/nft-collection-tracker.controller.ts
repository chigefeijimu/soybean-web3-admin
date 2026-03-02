import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CollectionData {
  name: string;
  symbol: string;
  contractAddress: string;
  chain: string;
  floorPrice: number;
  floorPriceChange24h: number;
  totalVolume: number;
  volume24h: number;
  sales24h: number;
  holders: number;
  totalSupply: number;
  marketCap: number;
  imageUrl: string;
}

interface NftListing {
  tokenId: string;
  price: number;
  seller: string;
  expiresAt: number;
}

interface NftSale {
  tokenId: string;
  price: number;
  buyer: string;
  seller: string;
  timestamp: number;
  txHash: string;
}

@Controller('web3/nft-collection')
export class NftCollectionTrackerController {
  private readonly openseaApiKey = process.env.OPENSEA_API_KEY || '';
  private readonly covalentApiKey = process.env.COVALENT_API_KEY || 'ckey_';
  
  // Popular NFT collections for tracking
  private popularCollections: CollectionData[] = [
    {
      name: 'Bored Ape Yacht Club',
      symbol: 'BAYC',
      contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      chain: 'ethereum',
      floorPrice: 18.5,
      floorPriceChange24h: 2.3,
      totalVolume: 98500,
      volume24h: 1250,
      sales24h: 15,
      holders: 6500,
      totalSupply: 10000,
      marketCap: 185000,
      imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
    },
    {
      name: 'CryptoPunks',
      symbol: 'PUNKS',
      contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      chain: 'ethereum',
      floorPrice: 45.2,
      floorPriceChange24h: -1.2,
      totalVolume: 156000,
      volume24h: 2100,
      sales24h: 8,
      holders: 3200,
      totalSupply: 10000,
      marketCap: 452000,
      imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
    },
    {
      name: 'Azuki',
      symbol: 'AZUKI',
      contractAddress: '0xed5af388653567af2f388e6224dbe7ed9e543fa',
      chain: 'ethereum',
      floorPrice: 8.2,
      floorPriceChange24h: 5.1,
      totalVolume: 62000,
      volume24h: 890,
      sales24h: 22,
      holders: 5800,
      totalSupply: 10000,
      marketCap: 82000,
      imageUrl: 'https://i.seadn.io/gae/Xq4g8eKkT5Fj9Kz-Jw71j3r8fIYR-LBD4R3q8y6W8g8Y9f0g8eKkT5Fj9Kz-Jw71j3r8fIYR-LBD4R3q8y6W8g8Y',
    },
    {
      name: 'Pudgy Penguins',
      symbol: 'PENGU',
      contractAddress: '0xbd3531da5cf5857e7c9a6e1b9a7c1f8d5b0e8c3a',
      chain: 'ethereum',
      floorPrice: 3.8,
      floorPriceChange24h: 0.5,
      totalVolume: 28000,
      volume24h: 420,
      sales24h: 35,
      holders: 4200,
      totalSupply: 8888,
      marketCap: 33768,
      imageUrl: 'https://i.seadn.io/gae/Pq8x8eKkT5Fj9Kz-Jw71j3r8fIYR-LBD4R3q8y6W8g',
    },
    {
      name: 'DeGods',
      symbol: 'DEGOD',
      contractAddress: '0x8a5d7e4c7b2c8d9e4f5a6b7c8d9e0f1a2b3c4d5e',
      chain: 'solana',
      floorPrice: 420,
      floorPriceChange24h: -3.2,
      totalVolume: 85000,
      volume24h: 1800,
      sales24h: 12,
      holders: 2800,
      totalSupply: 10000,
      marketCap: 4200000,
      imageUrl: 'https://i.seadn.io/gae/Rq8x8eKkT5Fj9Kz-Jw71j3r8fIYR-LBD4R3q8y6W8',
    },
    {
      name: 'Milady Maker',
      symbol: 'MILADY',
      contractAddress: '0x5a9d4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
      chain: 'ethereum',
      floorPrice: 1.9,
      floorPriceChange24h: 8.2,
      totalVolume: 15000,
      volume24h: 380,
      sales24h: 45,
      holders: 5100,
      totalSupply: 10000,
      marketCap: 19000,
      imageUrl: 'https://i.seadn.io/gae/Sq8x8eKkT5Fj9Kz-Jw71j3r8fIYR-LBD4R3q8y6W',
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  @Get('collections')
  async getPopularCollections(
    @Query('chain') chain?: string,
    @Query('sortBy') sortBy: string = 'volume',
    @Query('limit') limit: number = 20,
  ) {
    let collections = [...this.popularCollections];

    // Filter by chain if specified
    if (chain && chain !== 'all') {
      collections = collections.filter(c => c.chain === chain);
    }

    // Sort collections
    switch (sortBy) {
      case 'floorPrice':
        collections.sort((a, b) => b.floorPrice - a.floorPrice);
        break;
      case 'volume24h':
        collections.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'sales24h':
        collections.sort((a, b) => b.sales24h - a.sales24h);
        break;
      case 'holders':
        collections.sort((a, b) => b.holders - a.holders);
        break;
      case 'change24h':
        collections.sort((a, b) => b.floorPriceChange24h - a.floorPriceChange24h);
        break;
      default:
        collections.sort((a, b) => b.totalVolume - a.totalVolume);
    }

    return {
      success: true,
      data: collections.slice(0, limit),
      total: collections.length,
    };
  }

  @Get('collection/:address')
  async getCollectionDetails(@Param('address') address: string) {
    const collection = this.popularCollections.find(
      c => c.contractAddress.toLowerCase() === address.toLowerCase()
    );

    if (!collection) {
      return {
        success: false,
        error: 'Collection not found',
      };
    }

    // Simulate additional collection data
    const collectionDetails = {
      ...collection,
      description: `${collection.name} is a collection of ${collection.totalSupply} unique digital collectibles on the ${collection.chain} blockchain.`,
      traits: [
        { trait_type: 'Rarity', value: 'Legendary', count: 100, percentage: 1 },
        { trait_type: 'Background', value: 'Blue', count: 2000, percentage: 20 },
        { trait_type: 'Eyes', value: 'Laser', count: 500, percentage: 5 },
        { trait_type: 'Clothing', value: 'Suit', count: 1500, percentage: 15 },
      ],
      owners: [
        { address: '0x1234...5678', tokens: 25, percentage: 0.25 },
        { address: '0xabcd...efgh', tokens: 18, percentage: 0.18 },
        { address: '0x9876...5432', tokens: 12, percentage: 0.12 },
        { address: '0xdef0...1234', tokens: 8, percentage: 0.08 },
        { address: '0x5555...6666', tokens: 5, percentage: 0.05 },
      ],
      priceHistory: this.generatePriceHistory(collection.floorPrice),
      volumeHistory: this.generateVolumeHistory(collection.volume24h),
    };

    return {
      success: true,
      data: collectionDetails,
    };
  }

  @Get('collection/:address/listings')
  async getCollectionListings(
    @Param('address') address: string,
    @Query('limit') limit: number = 20,
  ) {
    const listings: NftListing[] = [];
    const collection = this.popularCollections.find(
      c => c.contractAddress.toLowerCase() === address.toLowerCase()
    );

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    // Generate sample listings
    for (let i = 0; i < Math.min(limit, 20); i++) {
      listings.push({
        tokenId: String(Math.floor(Math.random() * collection.totalSupply)),
        price: collection.floorPrice + Math.random() * 2,
        seller: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        expiresAt: Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000,
      });
    }

    listings.sort((a, b) => a.price - b.price);

    return {
      success: true,
      data: listings,
    };
  }

  @Get('collection/:address/sales')
  async getCollectionSales(
    @Param('address') address: string,
    @Query('limit') limit: number = 20,
  ) {
    const sales: NftSale[] = [];
    const collection = this.popularCollections.find(
      c => c.contractAddress.toLowerCase() === address.toLowerCase()
    );

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    // Generate sample sales
    for (let i = 0; i < Math.min(limit, 20); i++) {
      const hoursAgo = Math.random() * 24;
      sales.push({
        tokenId: String(Math.floor(Math.random() * collection.totalSupply)),
        price: collection.floorPrice + (Math.random() - 0.5) * 5,
        buyer: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        seller: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        timestamp: Date.now() - hoursAgo * 60 * 60 * 1000,
        txHash: `0x${Math.random().toString(16).slice(2)}`,
      });
    }

    sales.sort((a, b) => b.timestamp - a.timestamp);

    return {
      success: true,
      data: sales,
    };
  }

  @Get('collection/:address/holders')
  async getCollectionHolders(
    @Param('address') address: string,
    @Query('limit') limit: number = 50,
  ) {
    const holders = [];
    const collection = this.popularCollections.find(
      c => c.contractAddress.toLowerCase() === address.toLowerCase()
    );

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    // Generate sample holders
    let remainingSupply = collection.totalSupply;
    for (let i = 0; i < Math.min(limit, 100); i++) {
      const tokens = i < 5 ? Math.floor(Math.random() * 25) + 5 : 
                     Math.floor(Math.random() * (remainingSupply / 2));
      holders.push({
        rank: i + 1,
        address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        tokens,
        percentage: (tokens / collection.totalSupply * 100).toFixed(2),
        lastActivity: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      });
      remainingSupply -= tokens;
    }

    holders.sort((a, b) => b.tokens - a.tokens);

    return {
      success: true,
      data: holders,
      totalHolders: collection.holders,
    };
  }

  @Get('collection/:address/whales')
  async getCollectionWhales(@Param('address') address: string) {
    const collection = this.popularCollections.find(
      c => c.contractAddress.toLowerCase() === address.toLowerCase()
    );

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    // Generate whale activity data
    const whaleActivities = [
      { type: 'buy', address: '0x1234...5678', tokens: 5, totalValue: 92.5, time: '2h ago' },
      { type: 'buy', address: '0xabcd...efgh', tokens: 3, totalValue: 55.5, time: '5h ago' },
      { type: 'sell', address: '0x9876...5432', tokens: 2, totalValue: 36.4, time: '8h ago' },
      { type: 'buy', address: '0xdef0...1234', tokens: 8, totalValue: 148.0, time: '12h ago' },
      { type: 'transfer', address: '0x5555...6666', tokens: 1, totalValue: 18.5, time: '1d ago' },
    ];

    return {
      success: true,
      data: whaleActivities,
    };
  }

  @Get('trending')
  async getTrendingCollections(@Query('timeRange') timeRange: string = '24h') {
    // Return trending collections based on different time ranges
    const trending = [...this.popularCollections]
      .sort((a, b) => Math.abs(b.floorPriceChange24h) - Math.abs(a.floorPriceChange24h))
      .slice(0, 10)
      .map(c => ({
        ...c,
        trendScore: Math.abs(c.floorPriceChange24h) * c.sales24h,
      }));

    return {
      success: true,
      data: trending,
      timeRange,
    };
  }

  @Get('search')
  async searchCollections(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const results = this.popularCollections.filter(
      c => c.name.toLowerCase().includes(query.toLowerCase()) ||
           c.symbol.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: results,
    };
  }

  private generatePriceHistory(currentPrice: number): { timestamp: number; price: number }[] {
    const history = [];
    const now = Date.now();
    let price = currentPrice * 0.8; // Start at 80% of current price

    for (let i = 30; i >= 0; i--) {
      price = price * (0.98 + Math.random() * 0.06); // Random walk
      history.push({
        timestamp: now - i * 24 * 60 * 60 * 1000,
        price: Math.max(price, currentPrice * 0.5),
      });
    }

    // Ensure last price matches current
    history[history.length - 1].price = currentPrice;

    return history;
  }

  private generateVolumeHistory(avgVolume: number): { timestamp: number; volume: number }[] {
    const history = [];
    const now = Date.now();

    for (let i = 30; i >= 0; i--) {
      history.push({
        timestamp: now - i * 24 * 60 * 60 * 1000,
        volume: avgVolume * (0.5 + Math.random()),
      });
    }

    return history;
  }
}

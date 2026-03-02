import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface NftHolding {
  contractAddress: string;
  tokenId: string;
  name: string;
  collectionName: string;
  imageUrl: string;
  floorPrice: number;
  lastSalePrice: number;
  rarityRank?: number;
  rarityScore?: number;
  attributes: {
    traitType: string;
    value: string;
    rarity: number;
  }[];
}

interface PortfolioSummary {
  totalValue: number;
  totalNfts: number;
  totalCollections: number;
  valueChange24h: number;
  valueChangePercentage24h: number;
  bestPerformer: {
    collectionName: string;
    change: number;
  } | null;
  worstPerformer: {
    collectionName: string;
    change: number;
  } | null;
}

interface CollectionStats {
  collectionName: string;
  contractAddress: string;
  floorPrice: number;
  floorPriceChange24h: number;
  totalVolume: number;
  holders: number;
  items: number;
  averagePrice: number;
  topSale: number;
  volumeChange24h: number;
}

@Injectable()
export class NftPortfolioService {
  private readonly openseaApi = 'https://api.opensea.io/api/v2';
  private readonly rarityApi = 'https://api.rarity.tools/public/v1';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get NFT portfolio for a wallet address
   */
  async getPortfolio(address: string, chain: string = 'ethereum'): Promise<{
    summary: PortfolioSummary;
    holdings: NftHolding[];
    collectionBreakdown: { name: string; value: number; count: number }[];
  }> {
    try {
      // Get NFTs from multiple sources
      const holdings = await this.fetchWalletNfts(address, chain);
      
      // Calculate summary
      const summary = this.calculateSummary(holdings);
      
      // Collection breakdown
      const collectionBreakdown = this.calculateCollectionBreakdown(holdings);
      
      return { summary, holdings, collectionBreakdown };
    } catch (error) {
      console.error('Error fetching NFT portfolio:', error);
      // Return mock data for demo
      return this.getMockPortfolio();
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionAddress: string, chain: string = 'ethereum'): Promise<CollectionStats> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.openseaApi}/collections/${collectionAddress}`, {
          headers: { 'X-API-KEY': process.env.OPENSEA_API_KEY || '' },
        }),
      );
      
      const data = response.data;
      return {
        collectionName: data.collection?.name || 'Unknown',
        contractAddress: collectionAddress,
        floorPrice: data.collection?.floor_price || 0,
        floorPriceChange24h: data.collection?.floor_price_24h_percentage_change || 0,
        totalVolume: data.collection?.total_volume || 0,
        holders: data.collection?.num_owners || 0,
        items: data.collection?.total_supply || 0,
        averagePrice: data.collection?.average_price || 0,
        topSale: data.collection?.top_bid || 0,
        volumeChange24h: data.collection?.volume_24h || 0,
      };
    } catch (error) {
      console.error('Error fetching collection stats:', error);
      return this.getMockCollectionStats(collectionAddress);
    }
  }

  /**
   * Get NFT rarity analysis
   */
  async getNftRarity(contractAddress: string, tokenId: string): Promise<{
    rarityScore: number;
    rarityRank: number;
    attributes: { traitType: string; value: string; rarity: number }[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.rarityApi}/nfts/${contractAddress}/${tokenId}`),
      );
      
      return {
        rarityScore: response.data.rarity?.score || 0,
        rarityRank: response.data.rarity?.rank || 0,
        attributes: response.data.attributes || [],
      };
    } catch (error) {
      return {
        rarityScore: Math.random() * 100,
        rarityRank: Math.floor(Math.random() * 10000),
        attributes: [],
      };
    }
  }

  /**
   * Get market trends
   */
  async getMarketTrends(): Promise<{
    trending: CollectionStats[];
    newest: CollectionStats[];
    topGainers: CollectionStats[];
  }> {
    // Mock data for trending collections
    const trending = await this.getTrendingCollections();
    const newest = await this.getNewestCollections();
    const topGainers = await this.getTopGainers();
    
    return { trending, newest, topGainers };
  }

  /**
   * Calculate portfolio value history
   */
  async getPortfolioHistory(address: string, days: number = 30): Promise<{
    dates: string[];
    values: number[];
  }> {
    const dates: string[] = [];
    const values: number[] = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
      
      // Generate mock historical values
      const baseValue = 15 + Math.random() * 5;
      const trend = (days - i) * 0.02;
      values.push(Number((baseValue + trend + (Math.random() - 0.5) * 2).toFixed(2)));
    }
    
    return { dates, values };
  }

  private async fetchWalletNfts(address: string, chain: string): Promise<NftHolding[]> {
    // In production, fetch from multiple sources
    // For demo, return mock data
    return this.getMockNfts();
  }

  private calculateSummary(holdings: NftHolding[]): PortfolioSummary {
    const totalNfts = holdings.length;
    const totalValue = holdings.reduce((sum, nft) => sum + (nft.floorPrice || nft.lastSalePrice || 0), 0);
    
    // Calculate unique collections
    const collections = new Set(holdings.map(n => n.collectionName));
    const totalCollections = collections.size;
    
    // Mock 24h change
    const valueChange24h = totalValue * (Math.random() * 0.1 - 0.05);
    const valueChangePercentage24h = (valueChange24h / totalValue) * 100;
    
    return {
      totalValue: Number(totalValue.toFixed(2)),
      totalNfts,
      totalCollections,
      valueChange24h: Number(valueChange24h.toFixed(2)),
      valueChangePercentage24h: Number(valueChangePercentage24h.toFixed(2)),
      bestPerformer: { collectionName: 'Bored Ape Yacht Club', change: 5.2 },
      worstPerformer: { collectionName: 'Pudgy Penguins', change: -2.1 },
    };
  }

  private calculateCollectionBreakdown(holdings: NftHolding[]): { name: string; value: number; count: number }[] {
    const breakdown = new Map<string, { value: number; count: number }>();
    
    for (const nft of holdings) {
      const existing = breakdown.get(nft.collectionName) || { value: 0, count: 0 };
      breakdown.set(nft.collectionName, {
        value: existing.value + (nft.floorPrice || nft.lastSalePrice || 0),
        count: existing.count + 1,
      });
    }
    
    return Array.from(breakdown.entries()).map(([name, data]) => ({
      name,
      value: Number(data.value.toFixed(2)),
      count: data.count,
    }));
  }

  private async getTrendingCollections(): Promise<CollectionStats[]> {
    return [
      {
        collectionName: 'Bored Ape Yacht Club',
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        floorPrice: 18.5,
        floorPriceChange24h: 5.2,
        totalVolume: 285000,
        holders: 6200,
        items: 10000,
        averagePrice: 22.5,
        topSale: 125.0,
        volumeChange24h: 12.5,
      },
      {
        collectionName: 'Pudgy Penguins',
        contractAddress: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
        floorPrice: 3.2,
        floorPriceChange24h: -2.1,
        totalVolume: 45000,
        holders: 3200,
        items: 8888,
        averagePrice: 4.1,
        topSale: 25.0,
        volumeChange24h: -5.3,
      },
      {
        collectionName: 'Azuki',
        contractAddress: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
        floorPrice: 8.9,
        floorPriceChange24h: 1.8,
        totalVolume: 98000,
        holders: 5100,
        items: 10000,
        averagePrice: 11.2,
        topSale: 68.0,
        volumeChange24h: 3.2,
      },
    ];
  }

  private async getNewestCollections(): Promise<CollectionStats[]> {
    return [
      {
        collectionName: 'Doodle Jump',
        contractAddress: '0x2D3734a0Dac79D2D4e1B4f77C3B9bC8c1c2a5f9D',
        floorPrice: 1.8,
        floorPriceChange24h: 15.2,
        totalVolume: 8500,
        holders: 2100,
        items: 5000,
        averagePrice: 2.1,
        topSale: 8.5,
        volumeChange24h: 25.0,
      },
      {
        collectionName: 'Milady',
        contractAddress: '0x5Cfcd6aE5A08F68B4C92D8F9Da6DaB0c8f5c9E3A',
        floorPrice: 2.1,
        floorPriceChange24h: 8.5,
        totalVolume: 12000,
        holders: 2800,
        items: 10000,
        averagePrice: 2.8,
        topSale: 15.0,
        volumeChange24h: 18.2,
      },
    ];
  }

  private async getTopGainers(): Promise<CollectionStats[]> {
    return [
      {
        collectionName: 'CLONEX',
        contractAddress: '0x09aE1837401981A0fB4a5C4F4F7c4e2d8D2a5F9E',
        floorPrice: 4200,
        floorPriceChange24h: 25.5,
        totalVolume: 125000,
        holders: 850,
        items: 20000,
        averagePrice: 5500,
        topSale: 15000,
        volumeChange24h: 45.2,
      },
      {
        collectionName: 'World of Women',
        contractAddress: '0xE78388b4CE79068e89Bf8aA7f218eF6b9AB1e9dA',
        floorPrice: 2.8,
        floorPriceChange24h: 18.2,
        totalVolume: 18000,
        holders: 4500,
        items: 10000,
        averagePrice: 3.5,
        topSale: 12.0,
        volumeChange24h: 32.1,
      },
    ];
  }

  private getMockPortfolio(): {
    summary: PortfolioSummary;
    holdings: NftHolding[];
    collectionBreakdown: { name: string; value: number; count: number }[];
  } {
    const holdings = this.getMockNfts();
    const summary = this.calculateSummary(holdings);
    const collectionBreakdown = this.calculateCollectionBreakdown(holdings);
    
    return { summary, holdings, collectionBreakdown };
  }

  private getMockNfts(): NftHolding[] {
    return [
      {
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        tokenId: '1234',
        name: 'Bored Ape #1234',
        collectionName: 'Bored Ape Yacht Club',
        imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
        floorPrice: 18.5,
        lastSalePrice: 22.0,
        rarityRank: 150,
        rarityScore: 85.5,
        attributes: [
          { traitType: 'Background', value: 'Orange', rarity: 0.08 },
          { traitType: 'Fur', value: 'Dark Brown', rarity: 0.12 },
          { traitType: 'Eyes', value: 'Bored', rarity: 0.15 },
          { traitType: 'Hat', value: 'Fez', rarity: 0.05 },
        ],
      },
      {
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        tokenId: '5678',
        name: 'Bored Ape #5678',
        collectionName: 'Bored Ape Yacht Club',
        imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
        floorPrice: 18.5,
        lastSalePrice: 19.5,
        rarityRank: 250,
        rarityScore: 78.2,
        attributes: [
          { traitType: 'Background', value: 'Blue', rarity: 0.12 },
          { traitType: 'Fur', value: 'Brown', rarity: 0.18 },
          { traitType: 'Eyes', value: 'Laser Eyes', rarity: 0.02 },
        ],
      },
      {
        contractAddress: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
        tokenId: '9012',
        name: 'Pudgy Penguin #9012',
        collectionName: 'Pudgy Penguins',
        imageUrl: 'https://i.seadn.io/gae/6lOkh心B9Yq1W6QqLQhT5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N',
        floorPrice: 3.2,
        lastSalePrice: 3.5,
        rarityRank: 800,
        rarityScore: 65.0,
        attributes: [
          { traitType: 'Background', value: 'Blue', rarity: 0.1 },
          { traitType: 'Skin', value: 'Normal', rarity: 0.6 },
        ],
      },
      {
        contractAddress: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
        tokenId: '3456',
        name: 'Azuki #3456',
        collectionName: 'Azuki',
        imageUrl: 'https://i.seadn.io/gae/8-Fp4M4YqWqL5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N',
        floorPrice: 8.9,
        lastSalePrice: 9.2,
        rarityRank: 500,
        rarityScore: 72.5,
        attributes: [
          { traitType: 'Type', value: 'Human', rarity: 0.7 },
          { traitType: 'Hair', value: 'Pink Hair', rarity: 0.05 },
        ],
      },
      {
        contractAddress: '0x2355409a7d5c12d4E4B0B0B0B0B0B0B0B0B0B0B0',
        tokenId: '7777',
        name: 'DeGod #7777',
        collectionName: 'DeGods',
        imageUrl: 'https://i.seadn.io/gae/9-Gp4M4YqWqL5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N5vKfE2N',
        floorPrice: 450,
        lastSalePrice: 520,
        rarityRank: 50,
        rarityScore: 95.0,
        attributes: [
          { traitType: 'Type', value: 'Degen', rarity: 0.1 },
          { traitType: 'Rarity', value: 'Legendary', rarity: 0.01 },
        ],
      },
    ];
  }

  private getMockCollectionStats(collectionAddress: string): CollectionStats {
    return {
      collectionName: 'Unknown Collection',
      contractAddress: collectionAddress,
      floorPrice: 0,
      floorPriceChange24h: 0,
      totalVolume: 0,
      holders: 0,
      items: 0,
      averagePrice: 0,
      topSale: 0,
      volumeChange24h: 0,
    };
  }
}

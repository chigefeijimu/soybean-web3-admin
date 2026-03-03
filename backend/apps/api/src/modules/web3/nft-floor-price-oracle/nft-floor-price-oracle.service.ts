import { Injectable } from '@nestjs/common';

export interface FloorPriceOracleResult {
  collection: string;
  chain: string;
  floorPrice: number;
  floorPriceUSD: number;
  volume24h: number;
  sales24h: number;
  listings: number;
  avgPrice24h: number;
  marketplace: string;
  lastUpdated: number;
  priceChange24h: number;
  holders: number;
  totalSupply: number;
}

export interface CollectionStats {
  collection: string;
  chain: string;
  name: string;
  symbol: string;
  floorPrice: number;
  floorPriceUSD: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  sales24h: number;
  avgPrice: number;
  highestSale: number;
  lowestSale: number;
  totalSales: number;
  holders: number;
  totalSupply: number;
  marketCap: number;
  listingChange24h: number;
  floorChange24h: number;
}

export interface MarketplaceComparison {
  collection: string;
  chain: string;
  marketplaces: {
    name: string;
    floorPrice: number;
    listings: number;
    volume24h: number;
  }[];
  bestMarketplace: string;
  potentialSavings: number;
}

export interface HistoricalFloorPrice {
  collection: string;
  chain: string;
  prices: {
    timestamp: number;
    floorPrice: number;
    floorPriceUSD: number;
  }[];
}

@Injectable()
export class NftFloorPriceOracleService {
  private readonly supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'solana', 'avalanche'];
  private readonly supportedMarketplaces = ['opensea', 'blur', 'looksrare', 'foundation', 'x2y2', 'sudoswap', 'magiceden'];
  
  private readonly mockCollections = {
    ethereum: {
      '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': { name: 'BoredApeYachtClub', symbol: 'BAYC', floorPrice: 18.5, holders: 6324, totalSupply: 10000 },
      '0x23581767a106ae21c074b2276d25e5c3e136a68b': { name: 'Moonbirds', symbol: 'MOONBIRD', floorPrice: 2.8, holders: 4521, totalSupply: 10000 },
      '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b': { name: 'CloneX', symbol: 'CLONE-X', floorPrice: 3.2, holders: 8921, totalSupply: 20000 },
      '0x8a90cab2b38dba80c64b7734e58e1cdb38ba3c38': { name: 'Azuki', symbol: 'AZUKI', floorPrice: 8.5, holders: 6234, totalSupply: 10000 },
      '0xed5af388653567af2f388e6224dc7c4b3241c544': { name: 'AdidasIntoTheMetaverse', symbol: 'ADI', floorPrice: 1.2, holders: 4532, totalSupply: 10000 },
    },
    polygon: {
      '0x5a4e6d8b1c8c8c5c5c5c5c5c5c5c5c5c5c5c5c5c': { name: 'PolygonPunks', symbol: 'PUNK', floorPrice: 0.15, holders: 3200, totalSupply: 10000 },
      '0x6a0e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e': { name: 'PolygonZombies', symbol: 'ZOMB', floorPrice: 0.08, holders: 2100, totalSupply: 5000 },
    },
    arbitrum: {
      '0x912ce59d5e8d5c5e5e5e5e5e5e5e5e5e5e5e5e5e': { name: 'ArbitrumPunks', symbol: 'ARB-PUNK', floorPrice: 0.25, holders: 1500, totalSupply: 10000 },
    },
  };

  async getFloorPrice(collection: string, chain: string, marketplace?: string): Promise<FloorPriceOracleResult> {
    const normalizedChain = chain.toLowerCase();
    const normalizedCollection = collection.toLowerCase();
    
    if (!this.supportedChains.includes(normalizedChain)) {
      throw new Error(`Unsupported chain: ${chain}. Supported: ${this.supportedChains.join(', ')}`);
    }

    const mockData = this.mockCollections[normalizedChain as keyof typeof this.mockCollections];
    const collectionData = mockData?.[normalizedCollection];
    
    if (!collectionData) {
      const basePrice = Math.random() * 5 + 0.1;
      return {
        collection: normalizedCollection,
        chain: normalizedChain,
        floorPrice: basePrice,
        floorPriceUSD: basePrice * 3200,
        volume24h: Math.random() * 100 + 10,
        sales24h: Math.floor(Math.random() * 50) + 1,
        listings: Math.floor(Math.random() * 500) + 50,
        avgPrice24h: basePrice * (0.9 + Math.random() * 0.2),
        marketplace: marketplace || 'opensea',
        lastUpdated: Date.now(),
        priceChange24h: (Math.random() - 0.5) * 20,
        holders: Math.floor(Math.random() * 5000) + 500,
        totalSupply: 10000,
      };
    }

    const ethPrice = 3200;
    const priceVariation = 1 + (Math.random() - 0.5) * 0.1;
    const floorPrice = collectionData.floorPrice * priceVariation;
    
    return {
      collection: normalizedCollection,
      chain: normalizedChain,
      floorPrice: floorPrice,
      floorPriceUSD: floorPrice * ethPrice,
      volume24h: Math.random() * 200 + 20,
      sales24h: Math.floor(Math.random() * 100) + 10,
      listings: Math.floor(Math.random() * 1000) + 100,
      avgPrice24h: floorPrice * (0.85 + Math.random() * 0.3),
      marketplace: marketplace || 'opensea',
      lastUpdated: Date.now(),
      priceChange24h: (Math.random() - 0.5) * 15,
      holders: collectionData.holders,
      totalSupply: collectionData.totalSupply,
    };
  }

  async getCollectionStats(collection: string, chain: string): Promise<CollectionStats> {
    const normalizedChain = chain.toLowerCase();
    const normalizedCollection = collection.toLowerCase();
    
    if (!this.supportedChains.includes(normalizedChain)) {
      throw new Error(`Unsupported chain: ${chain}. Supported: ${this.supportedChains.join(', ')}`);
    }

    const mockData = this.mockCollections[normalizedChain as keyof typeof this.mockCollections];
    const collectionData = mockData?.[normalizedCollection];
    
    const ethPrice = 3200;
    const baseFloor = collectionData?.floorPrice || Math.random() * 5 + 0.1;
    const floorPrice = baseFloor * (0.95 + Math.random() * 0.1);
    
    return {
      collection: normalizedCollection,
      chain: normalizedChain,
      name: collectionData?.name || 'Unknown Collection',
      symbol: collectionData?.symbol || '???',
      floorPrice: floorPrice,
      floorPriceUSD: floorPrice * ethPrice,
      volume24h: Math.random() * 500 + 50,
      volume7d: Math.random() * 2000 + 200,
      volume30d: Math.random() * 8000 + 1000,
      sales24h: Math.floor(Math.random() * 100) + 10,
      avgPrice: floorPrice * (0.9 + Math.random() * 0.2),
      highestSale: floorPrice * (2 + Math.random() * 5),
      lowestSale: floorPrice * (0.5 + Math.random() * 0.3),
      totalSales: Math.floor(Math.random() * 10000) + 1000,
      holders: collectionData?.holders || Math.floor(Math.random() * 5000) + 500,
      totalSupply: collectionData?.totalSupply || 10000,
      marketCap: floorPrice * (collectionData?.totalSupply || 10000) * ethPrice,
      listingChange24h: (Math.random() - 0.5) * 30,
      floorChange24h: (Math.random() - 0.5) * 20,
    };
  }

  async getMarketplaceComparison(collection: string, chain: string): Promise<MarketplaceComparison> {
    const normalizedChain = chain.toLowerCase();
    const normalizedCollection = collection.toLowerCase();
    
    if (!this.supportedChains.includes(normalizedChain)) {
      throw new Error(`Unsupported chain: ${chain}. Supported: ${this.supportedChains.join(', ')}`);
    }

    const mockData = this.mockCollections[normalizedChain as keyof typeof this.mockCollections];
    const collectionData = mockData?.[normalizedCollection];
    const basePrice = collectionData?.floorPrice || Math.random() * 5 + 0.1;

    const marketplaces = this.supportedMarketplaces.map(mp => ({
      name: mp,
      floorPrice: basePrice * (0.85 + Math.random() * 0.3),
      listings: Math.floor(Math.random() * 500) + 50,
      volume24h: Math.random() * 200 + 20,
    }));

    const sorted = [...marketplaces].sort((a, b) => a.floorPrice - b.floorPrice);
    const best = sorted[0];
    const secondBest = sorted[1];
    const potentialSavings = secondBest ? (secondBest.floorPrice - best.floorPrice) : 0;

    return {
      collection: normalizedCollection,
      chain: normalizedChain,
      marketplaces,
      bestMarketplace: best.name,
      potentialSavings,
    };
  }

  async getHistoricalFloorPrice(collection: string, chain: string, days: number = 7): Promise<HistoricalFloorPrice> {
    const normalizedChain = chain.toLowerCase();
    const normalizedCollection = collection.toLowerCase();
    
    if (!this.supportedChains.includes(normalizedChain)) {
      throw new Error(`Unsupported chain: ${chain}. Supported: ${this.supportedChains.join(', ')}`);
    }

    const mockData = this.mockCollections[normalizedChain as keyof typeof this.mockCollections];
    const collectionData = mockData?.[normalizedCollection];
    const basePrice = collectionData?.floorPrice || Math.random() * 5 + 0.1;
    const ethPrice = 3200;
    
    const prices = [];
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * msPerDay);
      const trend = Math.sin(i / 2) * 0.1;
      const noise = (Math.random() - 0.5) * 0.1;
      const floorPrice = basePrice * (1 + trend + noise);
      
      prices.push({
        timestamp,
        floorPrice,
        floorPriceUSD: floorPrice * ethPrice,
      });
    }

    return {
      collection: normalizedCollection,
      chain: normalizedChain,
      prices,
    };
  }

  async getTrendingCollections(chain: string, limit: number = 10): Promise<any[]> {
    const normalizedChain = chain.toLowerCase();
    
    if (!this.supportedChains.includes(normalizedChain)) {
      throw new Error(`Unsupported chain: ${chain}. Supported: ${this.supportedChains.join(', ')}`);
    }

    const allCollections = Object.entries(this.mockCollections[normalizedChain as keyof typeof this.mockCollections] || {});
    const ethPrice = 3200;
    
    const trending = allCollections.map(([address, data]: [string, any]) => ({
      address,
      name: data.name,
      symbol: data.symbol,
      floorPrice: data.floorPrice,
      floorPriceUSD: data.floorPrice * ethPrice,
      volume24h: Math.random() * 500 + 50,
      sales24h: Math.floor(Math.random() * 100) + 10,
      priceChange24h: (Math.random() - 0.5) * 30,
      holders: data.holders,
      totalSupply: data.totalSupply,
    }));

    return trending
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit);
  }

  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  getSupportedMarketplaces(): string[] {
    return this.supportedMarketplaces;
  }
}

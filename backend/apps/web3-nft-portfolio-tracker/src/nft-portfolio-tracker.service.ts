import { Injectable } from '@nestjs/common';

export interface NftCollection {
  collectionAddress: string;
  chain: string;
  name: string;
  symbol?: string;
  totalSupply: number;
  holderCount: number;
  floorPrice: number;
  floorPriceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  imageUrl?: string;
}

export interface NftHolding {
  tokenId: string;
  collectionAddress: string;
  collectionName: string;
  chain: string;
  name: string;
  imageUrl: string;
  amount: number;
  acquisitionPrice?: number;
  acquisitionDate?: string;
  currentFloorPrice: number;
  currentValue: number;
  pnl?: number;
  pnlPercent?: number;
  rarity?: number;
  rarityRank?: number;
  attributes?: NftAttribute[];
}

export interface NftAttribute {
  trait_type: string;
  value: string;
  rarity: number;
}

export interface PortfolioSummary {
  address: string;
  totalNfts: number;
  totalCollections: number;
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  chainDistribution: Record<string, { count: number; value: number }>;
  topCollections: NftHolding[];
  valueHistory: PortfolioValuePoint[];
}

export interface PortfolioValuePoint {
  timestamp: string;
  value: number;
}

export interface CollectionAnalytics {
  collectionAddress: string;
  chain: string;
  holders: number;
  listings: number;
  averagePrice: number;
  volumeHistory: { timestamp: string; volume: number }[];
  priceHistory: { timestamp: string; floorPrice: number }[];
  holderDistribution: { range: string; percentage: number }[];
  traits: Record<string, Record<string, { value: string; count: number; rarity: number }>>;
}

@Injectable()
export class NftPortfolioTrackerService {
  private readonly mockCollections: Record<string, NftCollection> = {
    '0x1234...': {
      collectionAddress: '0x1234...',
      chain: 'ethereum',
      name: 'BoredApeYachtClub',
      symbol: 'BAYC',
      totalSupply: 10000,
      holderCount: 6500,
      floorPrice: 18.5,
      floorPriceChange24h: 2.3,
      volume24h: 1250,
      volumeChange24h: 15.2,
      marketCap: 185000,
      imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
    },
    '0x5678...': {
      collectionAddress: '0x5678...',
      chain: 'ethereum',
      name: 'CryptoPunks',
      symbol: 'PUNKS',
      totalSupply: 10000,
      holderCount: 4200,
      floorPrice: 45.2,
      floorPriceChange24h: -1.2,
      volume24h: 890,
      volumeChange24h: -5.8,
      marketCap: 452000,
      imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
    },
    '0xabcd...': {
      collectionAddress: '0xabcd...',
      chain: 'ethereum',
      name: ' PudgyPenguins',
      symbol: 'PENGU',
      totalSupply: 8888,
      holderCount: 5200,
      floorPrice: 3.2,
      floorPriceChange24h: 5.8,
      volume24h: 456,
      volumeChange24h: 22.3,
      marketCap: 28400,
      imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
    },
    '0xdef0...': {
      collectionAddress: '0xdef0...',
      chain: 'polygon',
      name: 'Aavegotchi',
      symbol: 'GHST',
      totalSupply: 10000,
      holderCount: 3800,
      floorPrice: 0.85,
      floorPriceChange24h: 0.5,
      volume24h: 125,
      volumeChange24h: 8.2,
      marketCap: 8500,
      imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
    },
  };

  getMockHoldings(address: string): NftHolding[] {
    const holdings: NftHolding[] = [
      {
        tokenId: '1234',
        collectionAddress: '0x1234...',
        collectionName: 'BoredApeYachtClub',
        chain: 'ethereum',
        name: 'Bored Ape #1234',
        imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
        amount: 1,
        acquisitionPrice: 15.5,
        acquisitionDate: '2024-06-15',
        currentFloorPrice: 18.5,
        currentValue: 18.5,
        pnl: 3.0,
        pnlPercent: 19.35,
        rarity: 85,
        rarityRank: 234,
        attributes: [
          { trait_type: 'Background', value: 'Orange', rarity: 0.12 },
          { trait_type: 'Fur', value: 'Dark Brown', rarity: 0.08 },
          { trait_type: 'Eyes', value: 'Bored', rarity: 0.15 },
          { trait_type: 'Hat', value: 'Fez', rarity: 0.05 },
        ],
      },
      {
        tokenId: '5678',
        collectionAddress: '0x5678...',
        collectionName: 'CryptoPunks',
        chain: 'ethereum',
        name: 'CryptoPunk #5678',
        imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
        amount: 1,
        acquisitionPrice: 42.0,
        acquisitionDate: '2024-03-20',
        currentFloorPrice: 45.2,
        currentValue: 45.2,
        pnl: 3.2,
        pnlPercent: 7.62,
        rarity: 92,
        rarityRank: 156,
        attributes: [
          { trait_type: 'Type', value: 'Alien', rarity: 0.02 },
          { trait_type: 'Accessory', value: 'Cap Forward', rarity: 0.08 },
        ],
      },
      {
        tokenId: '9012',
        collectionAddress: '0xabcd...',
        collectionName: 'PudgyPenguins',
        chain: 'ethereum',
        name: 'Pudgy Penguin #9012',
        imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
        amount: 1,
        acquisitionPrice: 2.8,
        acquisitionDate: '2024-08-10',
        currentFloorPrice: 3.2,
        currentValue: 3.2,
        pnl: 0.4,
        pnlPercent: 14.29,
        rarity: 72,
        rarityRank: 890,
        attributes: [
          { trait_type: 'Background', value: 'Blue', rarity: 0.18 },
          { trait_type: 'Body', value: 'Normal', rarity: 0.35 },
        ],
      },
      {
        tokenId: '3456',
        collectionAddress: '0xdef0...',
        collectionName: 'Aavegotchi',
        chain: 'polygon',
        name: 'Aavegotchi #3456',
        imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB',
        amount: 1,
        acquisitionPrice: 0.65,
        acquisitionDate: '2024-09-01',
        currentFloorPrice: 0.85,
        currentValue: 0.85,
        pnl: 0.2,
        pnlPercent: 30.77,
        rarity: 68,
        rarityRank: 1200,
        attributes: [
          { trait_type: 'Body', value: 'Spooky', rarity: 0.12 },
          { trait_type: 'Eyes', value: 'Wide Open', rarity: 0.08 },
        ],
      },
    ];

    return holdings;
  }

  getPortfolioSummary(address: string): PortfolioSummary {
    const holdings = this.getMockHoldings(address);
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.acquisitionPrice || 0), 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    const chainDistribution: Record<string, { count: number; value: number }> = {};
    holdings.forEach((h) => {
      if (!chainDistribution[h.chain]) {
        chainDistribution[h.chain] = { count: 0, value: 0 };
      }
      chainDistribution[h.chain].count += 1;
      chainDistribution[h.chain].value += h.currentValue;
    });

    const valueHistory: PortfolioValuePoint[] = [];
    let currentValue = totalValue * 0.7;
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      currentValue = currentValue * (1 + (Math.random() - 0.45) * 0.05);
      valueHistory.push({
        timestamp: date.toISOString(),
        value: parseFloat(currentValue.toFixed(2)),
      });
    }
    valueHistory[valueHistory.length - 1].value = totalValue;

    return {
      address,
      totalNfts: holdings.length,
      totalCollections: new Set(holdings.map((h) => h.collectionAddress)).size,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
      chainDistribution,
      topCollections: holdings.slice(0, 4),
      valueHistory,
    };
  }

  getCollectionAnalytics(collectionAddress: string): CollectionAnalytics {
    const volumeHistory: { timestamp: string; volume: number }[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      volumeHistory.push({
        timestamp: date.toISOString(),
        volume: Math.floor(Math.random() * 500 + 100),
      });
    }

    const priceHistory: { timestamp: string; floorPrice: number }[] = [];
    let basePrice = 15 + Math.random() * 10;
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      basePrice = basePrice * (1 + (Math.random() - 0.48) * 0.08);
      priceHistory.push({
        timestamp: date.toISOString(),
        floorPrice: parseFloat(basePrice.toFixed(2)),
      });
    }

    return {
      collectionAddress,
      chain: 'ethereum',
      holders: 6500,
      listings: 423,
      averagePrice: 22.5,
      volumeHistory,
      priceHistory,
      holderDistribution: [
        { range: '1 NFT', percentage: 45 },
        { range: '2-5 NFTs', percentage: 30 },
        { range: '6-10 NFTs', percentage: 15 },
        { range: '10+ NFTs', percentage: 10 },
      ],
      traits: {
        Background: {
          Orange: { value: 'Orange', count: 1200, rarity: 0.12 },
          Blue: { value: 'Blue', count: 1800, rarity: 0.18 },
          Purple: { value: 'Purple', count: 900, rarity: 0.09 },
          Yellow: { value: 'Yellow', count: 1500, rarity: 0.15 },
        },
        Fur: {
          'Dark Brown': { value: 'Dark Brown', count: 800, rarity: 0.08 },
          Brown: { value: 'Brown', count: 1500, rarity: 0.15 },
          Gray: { value: 'Gray', count: 600, rarity: 0.06 },
        },
      },
    };
  }

  getTrendingCollections(chain?: string): NftCollection[] {
    const collections = Object.values(this.mockCollections);
    if (chain) {
      return collections.filter((c) => c.chain === chain);
    }
    return collections.sort((a, b) => b.volume24h - a.volume24h).slice(0, 10);
  }
}

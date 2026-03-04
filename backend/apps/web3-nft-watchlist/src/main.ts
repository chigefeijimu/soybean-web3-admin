import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';

interface NftWatchlistItem {
  id: string;
  collectionAddress: string;
  chain: string;
  collectionName?: string;
  symbol?: string;
  floorPrice?: number;
  floorPriceChange24h?: number;
  volume24h?: number;
  holders?: number;
  imageUrl?: string;
  addedAt: number;
  notes?: string;
  alertEnabled: boolean;
  alertFloorPrice?: number;
}

interface WatchlistStats {
  totalItems: number;
  chains: Record<string, number>;
  totalFloorValue: number;
  totalVolume24h: number;
  alertsEnabled: number;
}

@Controller('api/nft-watchlist')
class NftWatchlistController {
  private watchlist: Map<string, NftWatchlistItem[]> = new Map();
  private idCounter = 1;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleItems: NftWatchlistItem[] = [
      {
        id: String(this.idCounter++),
        collectionAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        chain: 'ethereum',
        collectionName: 'BoredApeYachtClub',
        symbol: 'BAYC',
        floorPrice: 18.5,
        floorPriceChange24h: 2.3,
        volume24h: 1250.5,
        holders: 6320,
        imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0h3Vwa07IRw0M6Er0rBBM9xN3ycH56D3VVa',
        addedAt: Date.now() - 86400000 * 7,
        alertEnabled: true,
        alertFloorPrice: 15,
      },
      {
        id: String(this.idCounter++),
        collectionAddress: '0x23581767a106ae21c074b2276d25e5c3e136a68b',
        chain: 'ethereum',
        collectionName: 'Moonbird',
        symbol: 'MOONBIRD',
        floorPrice: 4.2,
        floorPriceChange24h: -1.5,
        volume24h: 320.8,
        holders: 4980,
        imageUrl: 'https://i.seadn.io/gae/XN4Xkv2z5z6Z8v6z8v6z8v6z8v6z8v6z8v6z8v6z8v6z8v6z8',
        addedAt: Date.now() - 86400000 * 3,
        alertEnabled: false,
      },
      {
        id: String(this.idCounter++),
        collectionAddress: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
        chain: 'ethereum',
        collectionName: 'CloneX',
        symbol: 'CLONEX',
        floorPrice: 3.8,
        floorPriceChange24h: 0.5,
        volume24h: 180.2,
        holders: 8920,
        imageUrl: 'https://i.seadn.io/gae/ABCD123456789',
        addedAt: Date.now() - 86400000 * 1,
        alertEnabled: true,
        alertFloorPrice: 3.0,
      },
    ];
    this.watchlist.set('default', sampleItems);
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'NFT Watchlist API',
      timestamp: Date.now(),
    };
  }

  @Get()
  getWatchlist(@Query('userId') userId?: string) {
    const userKey = userId || 'default';
    const items = this.watchlist.get(userKey) || [];
    return {
      success: true,
      data: items,
    };
  }

  @Post()
  addToWatchlist(@Body() body: {
    collectionAddress: string;
    chain: string;
    collectionName?: string;
    notes?: string;
    alertEnabled?: boolean;
    alertFloorPrice?: number;
    userId?: string;
  }) {
    const userKey = body.userId || 'default';
    const items = this.watchlist.get(userKey) || [];
    
    const exists = items.find(
      (item) => 
        item.collectionAddress.toLowerCase() === body.collectionAddress.toLowerCase() &&
        item.chain === body.chain
    );
    
    if (exists) {
      return {
        success: false,
        message: 'Collection already in watchlist',
      };
    }

    const newItem: NftWatchlistItem = {
      id: String(this.idCounter++),
      collectionAddress: body.collectionAddress,
      chain: body.chain,
      collectionName: body.collectionName || 'Unknown Collection',
      addedAt: Date.now(),
      notes: body.notes,
      alertEnabled: body.alertEnabled || false,
      alertFloorPrice: body.alertFloorPrice,
      floorPrice: Math.random() * 10 + 1,
      floorPriceChange24h: (Math.random() - 0.5) * 5,
      volume24h: Math.random() * 500 + 50,
      holders: Math.floor(Math.random() * 10000) + 1000,
      imageUrl: `https://i.seadn.io/gae/${Math.random().toString(36).substring(7)}`,
    };

    items.push(newItem);
    this.watchlist.set(userKey, items);

    return {
      success: true,
      data: newItem,
    };
  }

  @Put(':id')
  updateWatchlistItem(
    @Param('id') id: string,
    @Body() body: Partial<NftWatchlistItem> & { userId?: string },
    @Query('userId') queryUserId?: string,
  ) {
    const userKey = body.userId || queryUserId || 'default';
    const items = this.watchlist.get(userKey) || [];
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return {
        success: false,
        message: 'Item not found',
      };
    }

    items[index] = { ...items[index], ...body };
    this.watchlist.set(userKey, items);

    return {
      success: true,
      data: items[index],
    };
  }

  @Delete(':id')
  removeFromWatchlist(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    const userKey = userId || 'default';
    const items = this.watchlist.get(userKey) || [];
    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === items.length) {
      return {
        success: false,
        message: 'Item not found',
      };
    }

    this.watchlist.set(userKey, filtered);

    return {
      success: true,
      message: 'Item removed from watchlist',
    };
  }

  @Get('stats')
  getStats(@Query('userId') userId?: string) {
    const userKey = userId || 'default';
    const items = this.watchlist.get(userKey) || [];

    const stats: WatchlistStats = {
      totalItems: items.length,
      chains: {},
      totalFloorValue: 0,
      totalVolume24h: 0,
      alertsEnabled: 0,
    };

    items.forEach((item) => {
      stats.chains[item.chain] = (stats.chains[item.chain] || 0) + 1;
      stats.totalFloorValue += item.floorPrice || 0;
      stats.totalVolume24h += item.volume24h || 0;
      if (item.alertEnabled) stats.alertsEnabled++;
    });

    return {
      success: true,
      data: stats,
    };
  }

  @Post('refresh-prices')
  refreshPrices(@Query('userId') userId?: string) {
    const userKey = userId || 'default';
    const items = this.watchlist.get(userKey) || [];

    const updated = items.map((item) => ({
      ...item,
      floorPrice: item.floorPrice ? item.floorPrice * (1 + (Math.random() - 0.5) * 0.1) : 0,
      floorPriceChange24h: (Math.random() - 0.5) * 5,
      volume24h: item.volume24h ? item.volume24h * (1 + (Math.random() - 0.5) * 0.3) : 0,
    }));

    this.watchlist.set(userKey, updated);

    return {
      success: true,
      data: updated,
    };
  }

  @Post('bulk-add')
  bulkAdd(
    @Body() body: {
      collections: Array<{
        collectionAddress: string;
        chain: string;
        collectionName?: string;
      }>;
      userId?: string;
    },
  ) {
    const userKey = body.userId || 'default';
    const items = this.watchlist.get(userKey) || [];
    const added: NftWatchlistItem[] = [];

    body.collections.forEach((col) => {
      const exists = items.find(
        (item) =>
          item.collectionAddress.toLowerCase() === col.collectionAddress.toLowerCase() &&
          item.chain === col.chain
      );

      if (!exists) {
        const newItem: NftWatchlistItem = {
          id: String(this.idCounter++),
          collectionAddress: col.collectionAddress,
          chain: col.chain,
          collectionName: col.collectionName || 'Unknown Collection',
          addedAt: Date.now(),
          alertEnabled: false,
          floorPrice: Math.random() * 10 + 1,
          floorPriceChange24h: (Math.random() - 0.5) * 5,
          volume24h: Math.random() * 500 + 50,
          holders: Math.floor(Math.random() * 10000) + 1000,
        };
        items.push(newItem);
        added.push(newItem);
      }
    });

    this.watchlist.set(userKey, items);

    return {
      success: true,
      data: {
        added,
        skipped: body.collections.length - added.length,
      },
    };
  }

  @Post('clear')
  clearWatchlist(@Query('userId') userId?: string) {
    const userKey = userId || 'default';
    this.watchlist.set(userKey, []);

    return {
      success: true,
      message: 'Watchlist cleared',
    };
  }

  @Get('alerts')
  getAlerts(@Query('userId') userId?: string) {
    const userKey = userId || 'default';
    const items = this.watchlist.get(userKey) || [];

    const triggered = items.filter((item) => {
      if (!item.alertEnabled || !item.alertFloorPrice) return false;
      return item.floorPrice <= item.alertFloorPrice;
    });

    return {
      success: true,
      data: triggered,
    };
  }
}

@Module({
  controllers: [NftWatchlistController],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log('NFT Watchlist API running on http://localhost:3000');
}
bootstrap();

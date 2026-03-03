import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { NftFloorPriceOracleService, FloorPriceOracleResult, CollectionStats, MarketplaceComparison, HistoricalFloorPrice } from './nft-floor-price-oracle.service';

@Controller('web3/nft-floor-price-oracle')
export class NftFloorPriceOracleController {
  constructor(private readonly oracleService: NftFloorPriceOracleService) {}

  @Get('floor-price')
  async getFloorPrice(
    @Query('collection') collection: string,
    @Query('chain') chain: string,
    @Query('marketplace') marketplace?: string,
  ): Promise<FloorPriceOracleResult> {
    if (!collection || !chain) {
      throw new Error('Collection address and chain are required');
    }
    return this.oracleService.getFloorPrice(collection, chain, marketplace);
  }

  @Get('collection-stats')
  async getCollectionStats(
    @Query('collection') collection: string,
    @Query('chain') chain: string,
  ): Promise<CollectionStats> {
    if (!collection || !chain) {
      throw new Error('Collection address and chain are required');
    }
    return this.oracleService.getCollectionStats(collection, chain);
  }

  @Get('marketplace-comparison')
  async getMarketplaceComparison(
    @Query('collection') collection: string,
    @Query('chain') chain: string,
  ): Promise<MarketplaceComparison> {
    if (!collection || !chain) {
      throw new Error('Collection address and chain are required');
    }
    return this.oracleService.getMarketplaceComparison(collection, chain);
  }

  @Get('historical-floor-price')
  async getHistoricalFloorPrice(
    @Query('collection') collection: string,
    @Query('chain') chain: string,
    @Query('days') days: string = '7',
  ): Promise<HistoricalFloorPrice> {
    if (!collection || !chain) {
      throw new Error('Collection address and chain are required');
    }
    const daysNum = parseInt(days, 10) || 7;
    return this.oracleService.getHistoricalFloorPrice(collection, chain, daysNum);
  }

  @Get('trending-collections')
  async getTrendingCollections(
    @Query('chain') chain: string,
    @Query('limit') limit: string = '10',
  ): Promise<any[]> {
    if (!chain) {
      throw new Error('Chain is required');
    }
    const limitNum = parseInt(limit, 10) || 10;
    return this.oracleService.getTrendingCollections(chain, limitNum);
  }

  @Get('supported-chains')
  getSupportedChains(): string[] {
    return this.oracleService.getSupportedChains();
  }

  @Get('supported-marketplaces')
  getSupportedMarketplaces(): string[] {
    return this.oracleService.getSupportedMarketplaces();
  }

  @Get('health')
  healthCheck(): { status: string; timestamp: number } {
    return {
      status: 'operational',
      timestamp: Date.now(),
    };
  }
}

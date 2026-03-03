import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { NftFloorPredictionService } from './service/nft-floor-prediction.service';
import {
  PredictFloorPriceDto,
  GetCollectionPredictionsDto,
  GetPredictionHistoryDto,
  AddToWatchlistDto,
  GetTrendingCollectionsDto,
} from './dto/nft-floor-prediction.dto';

@Controller('nft-floor-prediction')
export class NftFloorPredictionController {
  constructor(
    private readonly nftFloorPredictionService: NftFloorPredictionService,
  ) {}

  @Post('predict')
  async predictFloorPrice(@Body() dto: PredictFloorPriceDto) {
    return this.nftFloorPredictionService.predictFloorPrice(dto);
  }

  @Get('collection/:address')
  async getCollectionPredictions(@Param('address') address: string) {
    return this.nftFloorPredictionService.getCollectionPredictions(address);
  }

  @Get('history')
  async getPredictionHistory(@Query() dto: GetPredictionHistoryDto) {
    return this.nftFloorPredictionService.getPredictionHistory(dto);
  }

  @Post('watchlist')
  async addToWatchlist(@Body() dto: AddToWatchlistDto) {
    return this.nftFloorPredictionService.addToWatchlist(dto);
  }

  @Get('watchlist/:userId')
  async getWatchlist(@Param('userId') userId: string) {
    return this.nftFloorPredictionService.getWatchlist(userId);
  }

  @Delete('watchlist/:id')
  async removeFromWatchlist(@Param('id') id: string) {
    return this.nftFloorPredictionService.removeFromWatchlist(id);
  }

  @Get('trending')
  async getTrendingCollections(@Query() dto: GetTrendingCollectionsDto) {
    return this.nftFloorPredictionService.getTrendingCollections(dto);
  }

  @Get('signals')
  async getSignals(
    @Query('chain') chain: string,
    @Query('signalType') signalType?: string,
  ) {
    return this.nftFloorPredictionService.getSignals(chain, signalType);
  }

  @Get('stats')
  async getStats() {
    return this.nftFloorPredictionService.getStats();
  }
}

import { Delete } from '@nestjs/common';

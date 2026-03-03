import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { NftFloorPredictionService, Chain, SignalType, TimeFrame } from './nft-floor-prediction.service';

@Controller('nft-floor-prediction')
export class NftFloorPredictionController {
  constructor(private readonly service: NftFloorPredictionService) {}

  @Post('predict')
  async predictFloorPrice(
    @Body() body: { address: string; chain: Chain; timeFrame?: TimeFrame }
  ) {
    return this.service.predictFloorPrice(body.address, body.chain, body.timeFrame);
  }

  @Get('collection/:address')
  async getCollectionPredictions(
    @Param('address') address: string,
    @Query('chain') chain: Chain
  ) {
    return this.service.getCollectionPredictions(address, chain);
  }

  @Get('trending')
  async getTrendingCollections(
    @Query('chain') chain: Chain,
    @Query('limit') limit?: number
  ) {
    return this.service.getTrendingCollections(chain, limit);
  }

  @Get('signals')
  async getSignals(
    @Query('chain') chain?: Chain,
    @Query('signalType') signalType?: SignalType
  ) {
    return this.service.getSignals(chain, signalType);
  }

  @Get('stats')
  async getStats() {
    return this.service.getStats();
  }
}

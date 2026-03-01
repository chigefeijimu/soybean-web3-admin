import { Controller, Get, Query } from '@nestjs/common';
import { ChainlinkPriceService } from './chainlink-price.service';

@Controller('chainlink-price')
export class ChainlinkPriceController {
  constructor(private readonly chainlinkPriceService: ChainlinkPriceService) {}

  @Get('feeds')
  async getPriceFeeds(
    @Query('chain') chain?: string,
    @Query('asset') asset?: string,
  ) {
    return this.chainlinkPriceService.getPriceFeeds(chain, asset);
  }

  @Get('latest')
  async getLatestPrices(@Query('pairs') pairs?: string) {
    return this.chainlinkPriceService.getLatestPrices(pairs);
  }

  @Get('history')
  async getPriceHistory(
    @Query('pair') pair: string,
    @Query('interval') interval?: string,
    @Query('hours') hours?: number,
  ) {
    return this.chainlinkPriceService.getPriceHistory(pair, interval, hours || 24);
  }

  @Get('networks')
  async getSupportedNetworks() {
    return this.chainlinkPriceService.getSupportedNetworks();
  }
}

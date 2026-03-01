import { Controller, Get, Query } from '@nestjs/common';
import { OptionsTrackerService } from './options-tracker.service';

@Controller('options-tracker')
export class OptionsTrackerController {
  constructor(private readonly optionsService: OptionsTrackerService) {}

  @Get('overview')
  async getOptionsOverview() {
    return this.optionsService.getOptionsOverview();
  }

  @Get('oi')
  async getOpenInterest(
    @Query('asset') asset: string,
    @Query('timeframe') timeframe: string
  ) {
    return this.optionsService.getOpenInterest(asset, timeframe);
  }

  @Get('put-call-ratio')
  async getPutCallRatio(
    @Query('asset') asset: string,
    @Query('expiry') expiry: string
  ) {
    return this.optionsService.getPutCallRatio(asset, expiry);
  }

  @Get('iv')
  async getImpliedVolatility(
    @Query('asset') asset: string,
    @Query('strike') strike: string
  ) {
    return this.optionsService.getImpliedVolatility(asset, strike);
  }

  @Get('expirations')
  async getExpirations(@Query('asset') asset: string) {
    return this.optionsService.getExpirations(asset);
  }

  @Get('volume')
  async getOptionsVolume(
    @Query('asset') asset: string,
    @Query('period') period: string
  ) {
    return this.optionsService.getOptionsVolume(asset, period);
  }
}

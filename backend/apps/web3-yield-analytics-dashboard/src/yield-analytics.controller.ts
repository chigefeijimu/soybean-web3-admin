import { Controller, Get, Query, Param } from '@nestjs/common';
import { YieldAnalyticsService } from './yield-analytics.service';

@Controller('yield-analytics')
export class YieldAnalyticsController {
  constructor(private readonly yieldAnalyticsService: YieldAnalyticsService) {}

  @Get()
  async getYieldAnalytics(@Query('wallet') wallet?: string) {
    return this.yieldAnalyticsService.getYieldAnalytics(wallet);
  }

  @Get('chains')
  async getChainYieldSummary() {
    return this.yieldAnalyticsService.getChainYieldSummary();
  }

  @Get('protocols')
  async getProtocolYieldSummary() {
    return this.yieldAnalyticsService.getProtocolYieldSummary();
  }

  @Get('history')
  async getYieldHistory(@Query('days') days?: string) {
    return this.yieldAnalyticsService.getYieldHistory(days ? parseInt(days) : 30);
  }

  @Get('types')
  async compareYieldByType() {
    return this.yieldAnalyticsService.compareYieldByType();
  }

  @Get('positions')
  async getYieldPositions() {
    return this.yieldAnalyticsService.getYieldPositions();
  }
}

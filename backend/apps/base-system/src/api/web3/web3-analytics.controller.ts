import { Controller, Get, Query } from '@nestjs/common';
import { Web3AnalyticsService } from './web3-analytics.service';

@Controller('web3/analytics')
export class Web3AnalyticsController {
  constructor(private readonly analyticsService: Web3AnalyticsService) {}

  @Get('network-stats')
  async getNetworkStats(@Query('chain') chain: string) {
    return this.analyticsService.getNetworkStats(chain || 'ethereum');
  }

  @Get('large-transactions')
  async getLargeTransactions(
    @Query('chain') chain: string,
    @Query('minValue') minValue: string,
    @Query('limit') limit: string,
  ) {
    return this.analyticsService.getLargeTransactions(
      chain || 'ethereum',
      parseInt(minValue) || 10000,
      parseInt(limit) || 20,
    );
  }

  @Get('popular-tokens')
  async getPopularTokens(@Query('chain') chain: string) {
    return this.analyticsService.getPopularTokens(chain || 'ethereum');
  }

  @Get('gas-history')
  async getGasHistory(
    @Query('chain') chain: string,
    @Query('days') days: string,
  ) {
    return this.analyticsService.getGasHistory(
      chain || 'ethereum',
      parseInt(days) || 7,
    );
  }

  @Get('block-stats')
  async getBlockStats(@Query('chain') chain: string) {
    return this.analyticsService.getBlockStats(chain || 'ethereum');
  }

  @Get('whale-activity')
  async getWhaleActivity(
    @Query('chain') chain: string,
    @Query('threshold') threshold: string,
  ) {
    return this.analyticsService.getWhaleActivity(
      chain || 'ethereum',
      parseInt(threshold) || 100000,
    );
  }
}

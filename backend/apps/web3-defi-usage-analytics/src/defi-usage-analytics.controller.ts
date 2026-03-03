import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DefiUsageAnalyticsService } from './defi-usage-analytics.service';

@Controller('defi-usage-analytics')
export class DefiUsageAnalyticsController {
  constructor(private readonly defiUsageAnalyticsService: DefiUsageAnalyticsService) {}

  @Get('analyze/:address')
  async analyzeUsage(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainIds = chains ? chains.split(',') : ['1', '137', '42161', '10', '56', '8453', '43114'];
    return this.defiUsageAnalyticsService.analyzeProtocolUsage(address, chainIds);
  }

  @Get('compare')
  async compareUsage(
    @Query('address1') address1: string,
    @Query('address2') address2: string,
    @Query('chains') chains?: string,
  ) {
    const chainIds = chains ? chains.split(',') : ['1', '137', '42161', '10', '56', '8453', '43114'];
    return this.defiUsageAnalyticsService.compareUsage(address1, address2, chainIds);
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.defiUsageAnalyticsService.getUsageLeaderboard(chainId, limit);
  }

  @Get('health')
  async health() {
    return { status: 'ok', service: 'DefiUsageAnalytics' };
  }
}

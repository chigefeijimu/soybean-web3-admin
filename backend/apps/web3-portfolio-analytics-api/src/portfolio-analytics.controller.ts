import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PortfolioAnalyticsService } from './portfolio-analytics.service';

@Controller('api/portfolio-analytics')
export class PortfolioAnalyticsController {
  constructor(private readonly portfolioService: PortfolioAnalyticsService) {}

  /**
   * Get portfolio summary for a wallet address
   * GET /api/portfolio-analytics/summary?address=0x...&chainId=1
   */
  @Get('summary')
  async getPortfolioSummary(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.portfolioService.getPortfolioSummary(address, parseInt(chainId));
  }

  /**
   * Get asset distribution by category
   * GET /api/portfolio-analytics/distribution?address=0x...&chainId=1
   */
  @Get('distribution')
  async getAssetDistribution(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.portfolioService.getAssetDistribution(address, parseInt(chainId));
  }

  /**
   * Get portfolio metrics (risk, diversification)
   * GET /api/portfolio-analytics/metrics?address=0x...&chainId=1
   */
  @Get('metrics')
  async getPortfolioMetrics(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.portfolioService.getPortfolioMetrics(address, parseInt(chainId));
  }

  /**
   * Get historical portfolio value
   * GET /api/portfolio-analytics/history?address=0x...&chainId=1&days=30
   */
  @Get('history')
  async getHistoricalValue(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
    @Query('days') days: string = '30',
  ) {
    return this.portfolioService.getHistoricalValue(address, parseInt(chainId), parseInt(days));
  }

  /**
   * Get top gainers and losers
   * GET /api/portfolio-analytics/gainers-losers?address=0x...&chainId=1
   */
  @Get('gainers-losers')
  async getGainersLosers(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.portfolioService.getGainersLosers(address, parseInt(chainId));
  }

  /**
   * Compare two portfolios
   * GET /api/portfolio-analytics/compare?address1=0x...&address2=0x...&chainId=1
   */
  @Get('compare')
  async comparePortfolios(
    @Query('address1') address1: string,
    @Query('address2') address2: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.portfolioService.comparePortfolios(address1, address2, parseInt(chainId));
  }

  /**
   * Get portfolio performance metrics
   * GET /api/portfolio-analytics/performance?address=0x...&chainId=1&timeframe=30d
   */
  @Get('performance')
  async getPerformanceMetrics(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    return this.portfolioService.getPerformanceMetrics(address, parseInt(chainId), timeframe);
  }

  /**
   * Batch get multiple wallet portfolios
   * POST /api/portfolio-analytics/batch
   * Body: { addresses: ["0x...", "0x..."], chainId: 1 }
   */
  @Post('batch')
  async getBatchPortfolios(
    @Body() body: { addresses: string[]; chainId?: number },
  ) {
    const chainId = body.chainId || 1;
    const results = await Promise.all(
      body.addresses.map(addr => 
        this.portfolioService.getPortfolioSummary(addr, chainId).catch(e => ({
          address: addr,
          error: e.message,
        }))
      )
    );
    return results;
  }
}

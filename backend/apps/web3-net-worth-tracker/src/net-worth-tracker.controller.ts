import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NetWorthTrackerService } from './net-worth-tracker.service';

@Controller('api/net-worth')
export class NetWorthTrackerController {
  constructor(private readonly netWorthService: NetWorthTrackerService) {}

  /**
   * Get current net worth for a wallet
   * GET /api/net-worth/current?address=0x...&chains=1,137,42161
   */
  @Get('current')
  async getCurrentNetWorth(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.getCurrentNetWorth(address, chainIds);
  }

  /**
   * Get net worth history
   * GET /api/net-worth/history?address=0x...&chains=1,137&days=30
   */
  @Get('history')
  async getNetWorthHistory(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
    @Query('days') days: string = '30',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.getNetWorthHistory(address, chainIds, parseInt(days));
  }

  /**
   * Get ROI metrics
   * GET /api/net-worth/roi?address=0x...&chains=1,137&timeframe=30d
   */
  @Get('roi')
  async getROIMetrics(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.getROIMetrics(address, chainIds, timeframe);
  }

  /**
   * Get portfolio value breakdown
   * GET /api/net-worth/breakdown?address=0x...&chains=1,137
   */
  @Get('breakdown')
  async getValueBreakdown(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.getValueBreakdown(address, chainIds);
  }

  /**
   * Get value trends and predictions
   * GET /api/net-worth/trends?address=0x...&chains=1,137
   */
  @Get('trends')
  async getValueTrends(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.getValueTrends(address, chainIds);
  }

  /**
   * Get top performing assets
   * GET /api/net-worth/top-performers?address=0x...&chains=1,137&limit=10
   */
  @Get('top-performers')
  async getTopPerformers(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
    @Query('limit') limit: string = '10',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.getTopPerformers(address, chainIds, parseInt(limit));
  }

  /**
   * Create net worth snapshot
   * POST /api/net-worth/snapshot
   * Body: { address: "0x...", chains: [1, 137] }
   */
  @Post('snapshot')
  async createSnapshot(
    @Body() body: { address: string; chains?: number[] },
  ) {
    const chainIds = body.chains || [1, 137, 42161];
    return this.netWorthService.createSnapshot(body.address, chainIds);
  }

  /**
   * Get benchmark comparison
   * GET /api/net-worth/benchmark?address=0x...&benchmark=btc&timeframe=30d
   */
  @Get('benchmark')
  async getBenchmarkComparison(
    @Query('address') address: string,
    @Query('benchmark') benchmark: string = 'btc',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    return this.netWorthService.getBenchmarkComparison(address, benchmark, timeframe);
  }

  /**
   * Get value alerts
   * GET /api/net-worth/alerts?address=0x...
   */
  @Get('alerts')
  async getValueAlerts(@Query('address') address: string) {
    return this.netWorthService.getValueAlerts(address);
  }

  /**
   * Set value alert
   * POST /api/net-worth/alerts
   * Body: { address: "0x...", threshold: 10000, direction: "above" }
   */
  @Post('alerts')
  async setValueAlert(
    @Body() body: { address: string; threshold: number; direction: 'above' | 'below' },
  ) {
    return this.netWorthService.setValueAlert(body.address, body.threshold, body.direction);
  }

  /**
   * Get portfolio diversification score
   * GET /api/net-worth/diversification?address=0x...&chains=1,137
   */
  @Get('diversification')
  async getDiversificationScore(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.getDiversificationScore(address, chainIds);
  }

  /**
   * Get multi-wallet net worth summary
   * POST /api/net-worth/multi-wallet
   * Body: { addresses: ["0x...", "0x..."], chains: [1, 137] }
   */
  @Post('multi-wallet')
  async getMultiWalletNetWorth(
    @Body() body: { addresses: string[]; chains?: number[] },
  ) {
    const chainIds = body.chains || [1, 137, 42161];
    return this.netWorthService.getMultiWalletNetWorth(body.addresses, chainIds);
  }

  /**
   * Get historical comparison (vs previous period)
   * GET /api/net-worth/compare-periods?address=0x...&chains=1,137&period1=30d&period2=7d
   */
  @Get('compare-periods')
  async comparePeriods(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161',
    @Query('period1') period1: string = '30d',
    @Query('period2') period2: string = '7d',
  ) {
    const chainIds = chains.split(',').map(Number);
    return this.netWorthService.comparePeriods(address, chainIds, period1, period2);
  }

  /**
   * Get net worth ranking
   * GET /api/net-worth/ranking?address=0x...&timeframe=30d
   */
  @Get('ranking')
  async getNetWorthRanking(
    @Query('address') address: string,
    @Query('timeframe') timeframe: string = '30d',
  ) {
    return this.netWorthService.getNetWorthRanking(address, timeframe);
  }

  /**
   * Export net worth data
   * GET /api/net-worth/export?address=0x...&format=csv
   */
  @Get('export')
  async exportNetWorthData(
    @Query('address') address: string,
    @Query('format') format: string = 'json',
    @Query('days') days: string = '30',
  ) {
    return this.netWorthService.exportNetWorthData(address, format, parseInt(days));
  }
}

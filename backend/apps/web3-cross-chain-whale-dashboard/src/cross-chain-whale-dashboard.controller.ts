import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { CrossChainWhaleDashboardService } from './cross-chain-whale-dashboard.service';

@Controller('web3/cross-chain-whale-dashboard')
export class CrossChainWhaleDashboardController {
  constructor(
    private readonly whaleDashboardService: CrossChainWhaleDashboardService,
  ) {}

  /**
   * Get whale activity overview across all chains
   */
  @Get('overview')
  async getWhaleActivityOverview() {
    return this.whaleDashboardService.getWhaleActivityOverview();
  }

  /**
   * Get recent large transactions
   */
  @Get('transactions')
  async getRecentTransactions(@Query('limit') limit: string = '20') {
    return this.whaleDashboardService.getRecentLargeTransactions(
      parseInt(limit, 10) || 20,
    );
  }

  /**
   * Get whale activity by chain
   */
  @Get('chain/:chain')
  async getWhaleActivityByChain(@Param('chain') chain: string) {
    return this.whaleDashboardService.getWhaleActivityByChain(chain);
  }

  /**
   * Get chain statistics
   */
  @Get('chains/stats')
  async getChainStats() {
    return this.whaleDashboardService.getChainStats();
  }

  /**
   * Get known whale addresses
   */
  @Get('whales')
  async getKnownWhales(@Query('type') type?: string) {
    return this.whaleDashboardService.getKnownWhales(type);
  }

  /**
   * Get whale details by address
   */
  @Get('whales/:address')
  async getWhaleDetails(@Param('address') address: string) {
    return this.whaleDashboardService.getWhaleDetails(address);
  }

  /**
   * Search whales
   */
  @Get('whales/search/:query')
  async searchWhales(@Param('query') query: string) {
    return this.whaleDashboardService.searchWhales(query);
  }

  /**
   * Get alert configurations
   */
  @Get('alerts')
  async getAlertConfigs() {
    return this.whaleDashboardService.getAlertConfigs();
  }

  /**
   * Create alert configuration
   */
  @Post('alerts')
  async createAlertConfig(
    @Body()
    config: {
      name: string;
      threshold: number;
      chains: string[];
      address?: string;
    },
  ) {
    return this.whaleDashboardService.createAlertConfig(config);
  }

  /**
   * Get whale activity timeline
   */
  @Get('timeline')
  async getWhaleActivityTimeline(@Query('hours') hours: string = '24') {
    return this.whaleDashboardService.getWhaleActivityTimeline(
      parseInt(hours, 10) || 24,
    );
  }

  /**
   * Get cross-chain flow analysis
   */
  @Get('flows')
  async getCrossChainFlow() {
    return this.whaleDashboardService.getCrossChainFlow();
  }

  /**
   * Get whale leaderboard
   */
  @Get('leaderboard')
  async getWhaleLeaderboard(@Query('limit') limit: string = '10') {
    return this.whaleDashboardService.getWhaleLeaderboard(
      parseInt(limit, 10) || 10,
    );
  }
}

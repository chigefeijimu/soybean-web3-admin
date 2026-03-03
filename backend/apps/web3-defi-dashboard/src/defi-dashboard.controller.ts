import { Controller, Get, Query } from '@nestjs/common';
import { DefiDashboardService } from './defi-dashboard.service';

@Controller()
export class DefiDashboardController {
  constructor(private readonly defiDashboardService: DefiDashboardService) {}

  @Get('api/defi-dashboard/summary')
  async getDashboardSummary(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161,10,56,8453,43114',
  ) {
    const chainList = chains.split(',').map(Number);
    return this.defiDashboardService.getDashboardSummary(address, chainList);
  }

  @Get('api/defi-dashboard/positions')
  async getPositions(
    @Query('address') address: string,
    @Query('chain') chain: number = 1,
  ) {
    return this.defiDashboardService.getPositions(address, chain);
  }

  @Get('api/defi-dashboard/yield-opportunities')
  async getYieldOpportunities(
    @Query('chain') chain: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.defiDashboardService.getYieldOpportunities(chain, limit);
  }

  @Get('api/defi-dashboard/protocols')
  async getProtocolStats() {
    return this.defiDashboardService.getProtocolStats();
  }

  @Get('api/defi-dashboard/portfolio-distribution')
  async getPortfolioDistribution(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161,10,56,8453,43114',
  ) {
    const chainList = chains.split(',').map(Number);
    return this.defiDashboardService.getPortfolioDistribution(address, chainList);
  }

  @Get('api/defi-dashboard/risk-analysis')
  async getRiskAnalysis(
    @Query('address') address: string,
    @Query('chains') chains: string = '1,137,42161,10,56,8453,43114',
  ) {
    const chainList = chains.split(',').map(Number);
    return this.defiDashboardService.getRiskAnalysis(address, chainList);
  }

  @Get('api/defi-dashboard/market-overview')
  async getMarketOverview() {
    return this.defiDashboardService.getMarketOverview();
  }
}

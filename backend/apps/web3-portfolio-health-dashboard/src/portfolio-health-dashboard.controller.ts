import { Controller, Get, Param, Query } from '@nestjs/common';
import { PortfolioHealthDashboardService } from './portfolio-health-dashboard.service';

@Controller('portfolio-health-dashboard')
export class PortfolioHealthDashboardController {
  constructor(
    private readonly portfolioHealthDashboardService: PortfolioHealthDashboardService
  ) {}

  @Get('analyze/:address')
  async analyzePortfolio(@Param('address') address: string) {
    return this.portfolioHealthDashboardService.analyzePortfolio(address);
  }

  @Get('trends/:address')
  async getHealthTrends(
    @Param('address') address: string,
    @Query('days') days: string = '30'
  ) {
    return this.portfolioHealthDashboardService.getHealthTrends(address, parseInt(days));
  }

  @Get('compare')
  async comparePortfolios(
    @Query('address1') address1: string,
    @Query('address2') address2: string
  ) {
    return this.portfolioHealthDashboardService.comparePortfolios(address1, address2);
  }

  @Get('rebalance/:address')
  async getRebalancingStrategy(
    @Param('address') address: string,
    @Query('chains') chains?: string
  ) {
    const targetChains = chains ? chains.split(',').map(c => ({ chain: c.trim(), target: 0 })) : undefined;
    return this.portfolioHealthDashboardService.getRebalancingStrategy(address, targetChains);
  }

  @Get('health-check')
  healthCheck() {
    return { 
      status: 'ok', 
      service: 'web3-portfolio-health-dashboard',
      timestamp: new Date().toISOString()
    };
  }
}

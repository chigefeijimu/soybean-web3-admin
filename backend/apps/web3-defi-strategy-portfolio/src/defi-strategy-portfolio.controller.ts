import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DefiStrategyPortfolioService, Strategy, StrategyPortfolio, PortfolioPerformance, RebalanceRecommendation } from './defi-strategy-portfolio.service';

@Controller('web3/defi-strategy-portfolio')
export class DefiStrategyPortfolioController {
  constructor(private readonly defiStrategyPortfolioService: DefiStrategyPortfolioService) {}

  /**
   * Get all available strategies
   */
  @Get('strategies')
  getAllStrategies(): Strategy[] {
    return this.defiStrategyPortfolioService.getAllStrategies();
  }

  /**
   * Get strategies by chain
   */
  @Get('strategies/chain/:chainId')
  getStrategiesByChain(
    @Param('chainId') chainId: string
  ): Strategy[] {
    return this.defiStrategyPortfolioService.getStrategiesByChain(parseInt(chainId));
  }

  /**
   * Get strategies by type
   */
  @Get('strategies/type/:type')
  getStrategiesByType(
    @Param('type') type: string
  ): Strategy[] {
    return this.defiStrategyPortfolioService.getStrategiesByType(type);
  }

  /**
   * Get strategies by risk level
   */
  @Get('strategies/risk/:risk')
  getStrategiesByRisk(
    @Param('risk') risk: string
  ): Strategy[] {
    return this.defiStrategyPortfolioService.getStrategiesByRisk(risk as 'low' | 'medium' | 'high');
  }

  /**
   * Get top performing strategies
   */
  @Get('strategies/top')
  getTopStrategies(
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy: 'apy' | 'pnl' | 'tvl' = 'apy'
  ): Strategy[] {
    return this.defiStrategyPortfolioService.getTopStrategies(
      parseInt(limit) || 10,
      sortBy
    );
  }

  /**
   * Get strategy details by ID
   */
  @Get('strategy/:id')
  getStrategyById(
    @Param('id') id: string
  ): Strategy | undefined {
    return this.defiStrategyPortfolioService.getStrategyById(id);
  }

  /**
   * Get portfolio for a wallet address
   */
  @Get('portfolio/:address')
  getPortfolio(
    @Param('address') address: string
  ): StrategyPortfolio {
    return this.defiStrategyPortfolioService.getPortfolio(address);
  }

  /**
   * Get portfolio performance metrics
   */
  @Get('portfolio/:address/performance')
  getPortfolioPerformance(
    @Param('address') address: string
  ): PortfolioPerformance {
    return this.defiStrategyPortfolioService.getPortfolioPerformance(address);
  }

  /**
   * Get rebalancing recommendations
   */
  @Get('portfolio/:address/rebalance')
  getRebalanceRecommendations(
    @Param('address') address: string
  ): RebalanceRecommendation[] {
    return this.defiStrategyPortfolioService.getRebalanceRecommendations(address);
  }

  /**
   * Get portfolio summary
   */
  @Get('portfolio/:address/summary')
  getPortfolioSummary(
    @Param('address') address: string
  ) {
    return this.defiStrategyPortfolioService.getPortfolioSummary(address);
  }

  /**
   * Get market overview
   */
  @Get('market')
  getMarketOverview() {
    return this.defiStrategyPortfolioService.getMarketOverview();
  }
}

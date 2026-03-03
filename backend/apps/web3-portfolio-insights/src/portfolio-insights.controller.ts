import { Controller, Get, Query } from '@nestjs/common';
import { PortfolioInsightsService } from './portfolio-insights.service';

@Controller('api/portfolio-insights')
export class PortfolioInsightsController {
  constructor(private readonly insightsService: PortfolioInsightsService) {}

  /**
   * Get AI-powered portfolio insights
   * GET /api/portfolio-insights?address=0x...&chainId=1
   */
  @Get()
  async getPortfolioInsights(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.insightsService.generateInsights(address, parseInt(chainId));
  }

  /**
   * Get portfolio risk assessment
   * GET /api/portfolio-insights/risk?address=0x...&chainId=1
   */
  @Get('risk')
  async getRiskAssessment(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.insightsService.assessRisk(address, parseInt(chainId));
  }

  /**
   * Get optimization recommendations
   * GET /api/portfolio-insights/optimize?address=0x...&chainId=1
   */
  @Get('optimize')
  async getOptimizationRecommendations(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.insightsService.getOptimizationRecommendations(address, parseInt(chainId));
  }

  /**
   * Get market sentiment analysis based on portfolio
   * GET /api/portfolio-insights/sentiment?address=0x...&chainId=1
   */
  @Get('sentiment')
  async getMarketSentiment(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.insightsService.analyzeMarketSentiment(address, parseInt(chainId));
  }

  /**
   * Compare portfolio with benchmarks
   * GET /api/portfolio-insights/benchmark?address=0x...&chainId=1
   */
  @Get('benchmark')
  async compareWithBenchmark(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1',
  ) {
    return this.insightsService.compareWithBenchmark(address, parseInt(chainId));
  }
}

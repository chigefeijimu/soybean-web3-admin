import { Controller, Get, Query } from '@nestjs/common';
import { VolatilityAnalyzerService } from './volatility-analyzer.service';

@Controller('web3/volatility')
export class VolatilityAnalyzerController {
  constructor(private readonly volatilityService: VolatilityAnalyzerService) {}

  @Get('analyze')
  async analyzeToken(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    return this.volatilityService.analyzeTokenVolatility(address, chain, timeframe);
  }

  @Get('history')
  async getVolatilityHistory(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('days') days: number = 30,
  ) {
    return this.volatilityService.getVolatilityHistory(address, chain, days);
  }

  @Get('compare')
  async compareTokens(
    @Query('addresses') addresses: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '30d',
  ) {
    const addressList = addresses.split(',');
    return this.volatilityService.compareTokenVolatility(addressList, chain, timeframe);
  }

  @Get('rankings')
  async getVolatilityRankings(
    @Query('chain') chain: string = 'ethereum',
    @Query('sort') sort: string = 'volatility',
    @Query('limit') limit: number = 20,
  ) {
    return this.volatilityService.getVolatilityRankings(chain, sort, limit);
  }

  @Get('risk-assessment')
  async getRiskAssessment(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.volatilityService.getRiskAssessment(address, chain);
  }
}

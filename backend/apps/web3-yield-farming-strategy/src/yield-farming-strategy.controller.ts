import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { YieldFarmingStrategyService } from './yield-farming-strategy.service';

@Controller('web3/yield-farming-strategy')
export class YieldFarmingStrategyController {
  constructor(private readonly service: YieldFarmingStrategyService) {}

  @Post('generate')
  async generateStrategy(@Body() params: {
    capital: number;
    riskTolerance: 'low' | 'medium' | 'high';
    preferredChains?: string[];
    preferredProtocols?: string[];
    investmentGoal: 'stable' | 'balanced' | 'aggressive';
    timeframe: 'short' | 'medium' | 'long';
  }) {
    return this.service.generateStrategy({
      capital: params.capital || 10000,
      riskTolerance: params.riskTolerance || 'medium',
      preferredChains: params.preferredChains || [],
      preferredProtocols: params.preferredProtocols || [],
      investmentGoal: params.investmentGoal || 'balanced',
      timeframe: params.timeframe || 'medium',
    });
  }

  @Get('market-overview')
  async getMarketOverview() {
    return this.service.getMarketOverview();
  }

  @Get('top-strategies')
  async getTopStrategies() {
    return this.service.getTopStrategies();
  }

  @Get('protocols')
  async getProtocols() {
    return this.service.getProtocols();
  }
}

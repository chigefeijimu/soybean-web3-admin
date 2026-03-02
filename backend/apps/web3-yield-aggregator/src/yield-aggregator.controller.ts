import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { YieldAggregatorService } from './yield-aggregator.service';

@Controller('yield-aggregator')
export class YieldAggregatorController {
  constructor(private readonly yieldAggregatorService: YieldAggregatorService) {}

  @Get('cross-chain')
  async getCrossChainYield(@Query('chains') chains?: string) {
    const chainIds = chains ? chains.split(',').map(Number) : undefined;
    return this.yieldAggregatorService.getCrossChainYield(chainIds);
  }

  @Get('top-opportunities')
  async getTopOpportunities(@Query('limit') limit?: string) {
    return this.yieldAggregatorService.getTopYieldOpportunities(
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get('compare')
  async getYieldComparison(@Query('token') token: string) {
    return this.yieldAggregatorService.getYieldComparison(token || 'ETH');
  }

  @Get('protocol/:name')
  async getProtocolYield(@Query('name') name: string) {
    return this.yieldAggregatorService.getYieldByProtocol(name);
  }

  @Post('calculate')
  async calculateReturns(
    @Body() body: { principal: number; apy: number; durationDays: number; compoundFrequency?: 'daily' | 'weekly' | 'monthly' }
  ) {
    return this.yieldAggregatorService.calculatePotentialReturns(
      body.principal,
      body.apy,
      body.durationDays,
      body.compoundFrequency || 'daily'
    );
  }
}

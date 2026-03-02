import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { YieldFarmingService } from './yield-farming.service';

@Controller('web3/yield-farming')
export class YieldFarmingController {
  constructor(private readonly yieldFarmingService: YieldFarmingService) {}

  @Get('pools')
  async getPools(
    @Query('chain') chain?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.yieldFarmingService.getYieldPools(chain, sortBy);
  }

  @Get('pool/:poolAddress')
  async getPoolDetails(@Query('poolAddress') poolAddress: string) {
    return this.yieldFarmingService.getPoolDetails(poolAddress);
  }

  @Get('portfolio')
  async getPortfolio(@Query('address') address: string) {
    return this.yieldFarmingService.getPortfolio(address);
  }

  @Get('stats')
  async getStats() {
    return this.yieldFarmingService.getYieldFarmingStats();
  }

  @Get('trending')
  async getTrendingPools() {
    return this.yieldFarmingService.getTrendingPools();
  }

  @Post('track')
  async trackPortfolio(
    @Body() body: { address: string; pools: string[] },
  ) {
    return this.yieldFarmingService.trackPortfolio(body.address, body.pools);
  }

  @Get('calculator')
  async calculateYield(
    @Query('principal') principal: string,
    @Query('apy') apy: string,
    @Query('days') days: string,
    @Query('compoundFrequency') compoundFrequency?: string,
  ) {
    return this.yieldFarmingService.calculateYield(
      parseFloat(principal),
      parseFloat(apy),
      parseInt(days),
      compoundFrequency || 'daily',
    );
  }

  @Get('opportunities')
  async findOpportunities(
    @Query('minApy') minApy?: string,
    @Query('maxRisk') maxRisk?: string,
  ) {
    return this.yieldFarmingService.findOpportunities(
      minApy ? parseFloat(minApy) : undefined,
      maxRisk,
    );
  }
}

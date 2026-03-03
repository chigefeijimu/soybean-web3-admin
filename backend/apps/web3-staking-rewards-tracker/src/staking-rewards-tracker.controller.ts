import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { StakingRewardsTrackerService } from './staking-rewards-tracker.service';

@Controller('web3/staking-rewards-tracker')
export class StakingRewardsTrackerController {
  constructor(private readonly service: StakingRewardsTrackerService) {}

  @Get('rewards')
  async getStakingRewards(
    @Query('address') address: string,
    @Query('chain') chain?: string,
  ) {
    return this.service.getStakingRewards(address, chain);
  }

  @Get('positions')
  async getStakingPositions(
    @Query('address') address: string,
    @Query('chain') chain?: string,
  ) {
    return this.service.getStakingPositions(address, chain);
  }

  @Get('protocols')
  async getSupportedProtocols() {
    return this.service.getSupportedProtocols();
  }

  @Get('chains')
  async getSupportedChains() {
    return this.service.getSupportedChains();
  }

  @Get('overview')
  async getStakingOverview(@Query('address') address: string) {
    return this.service.getStakingOverview(address);
  }

  @Get('history')
  async getRewardsHistory(
    @Query('address') address: string,
    @Query('chain') chain?: string,
    @Query('days') days?: number,
  ) {
    return this.service.getRewardsHistory(address, chain, days || 30);
  }

  @Get('calculators')
  async getRewardsCalculators() {
    return this.service.getRewardsCalculators();
  }

  @Post('calculate')
  async calculatePotentialRewards(@Body() params: {
    protocol: string;
    chain: string;
    amount: number;
    duration: number;
  }) {
    return this.service.calculatePotentialRewards(params);
  }

  @Get('top-pools')
  async getTopStakingPools(
    @Query('chain') chain?: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getTopStakingPools(chain, limit || 10);
  }

  @Get('apy-comparison')
  async getApyComparison(@Query('chain') chain?: string) {
    return this.service.getApyComparison(chain);
  }
}

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { StakingValidatorPerformanceService } from './staking-validator-performance.service';

@Controller('staking-validator-performance')
export class StakingValidatorPerformanceController {
  constructor(private readonly stakingValidatorPerformanceService: StakingValidatorPerformanceService) {}

  @Get('validators')
  async getValidators(
    @Query('chain') chain?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('sortBy') sortBy?: string,
    @Query('status') status?: string,
  ) {
    return this.stakingValidatorPerformanceService.getValidators(
      chain,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      sortBy,
      status,
    );
  }

  @Get('validators/:id')
  async getValidatorById(@Param('id') id: string) {
    return this.stakingValidatorPerformanceService.getValidatorById(id);
  }

  @Get('validators/:id/performance')
  async getValidatorPerformance(@Param('id') id: string) {
    return this.stakingValidatorPerformanceService.getValidatorPerformance(id);
  }

  @Get('top')
  async getTopValidators(@Query('limit') limit?: number) {
    return this.stakingValidatorPerformanceService.getTopValidators(
      limit ? Number(limit) : 10,
    );
  }

  @Get('chains')
  async getSupportedChains() {
    return this.stakingValidatorPerformanceService.getSupportedChains();
  }

  @Get('chains/:chain/stats')
  async getChainStats(@Param('chain') chain: string) {
    return this.stakingValidatorPerformanceService.getChainStats(chain);
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'Staking Validator Performance' };
  }
}

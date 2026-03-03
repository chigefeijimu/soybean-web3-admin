import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { YieldFarmingOptimizerService, YieldPool, OptimizationRequest, OptimizationResult, PoolHistoricalData } from './yield-farming-optimizer.service';

class PoolFiltersDto {
  chain?: string;
  protocol?: string;
  minTvl?: number;
  minApy?: number;
  risk?: string;
}

class OptimizeYieldDto implements OptimizationRequest {
  principal: number;
  duration: number;
  riskTolerance: 'low' | 'medium' | 'high';
  preferredChains?: string[];
  preferredProtocols?: string[];
  tokenPreference?: string;
}

class CompoundGrowthDto {
  principal: number;
  apy: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  days: number;
}

@Controller('yield-farming-optimizer')
export class YieldFarmingOptimizerController {
  constructor(private readonly service: YieldFarmingOptimizerService) {}

  @Get('pools')
  async getPools(@Query() filters: PoolFiltersDto): Promise<YieldPool[]> {
    return this.service.getPools(filters);
  }

  @Get('pools/:id')
  async getPoolDetails(@Param('id') id: string): Promise<YieldPool | null> {
    return this.service.getPoolDetails(id);
  }

  @Get('top-pools')
  async getTopPools(
    @Query('limit') limit = '10',
    @Query('chain') chain?: string,
  ): Promise<YieldPool[]> {
    return this.service.getTopPools(parseInt(limit, 10), chain);
  }

  @Post('optimize')
  async optimizeYield(@Body() request: OptimizeYieldDto): Promise<OptimizationResult> {
    return this.service.optimizeYield(request);
  }

  @Get('historical/:poolId')
  async getHistoricalData(
    @Param('poolId') poolId: string,
    @Query('days') days = '30',
  ): Promise<PoolHistoricalData> {
    return this.service.getHistoricalData(poolId, parseInt(days, 10));
  }

  @Post('compound')
  async calculateCompoundGrowth(@Body() dto: CompoundGrowthDto) {
    return this.service.calculateCompoundGrowth(
      dto.principal,
      dto.apy,
      dto.frequency,
      dto.days,
    );
  }

  @Post('compare')
  async comparePools(@Body('poolIds') poolIds: string[]) {
    return this.service.comparePools(poolIds);
  }

  @Get('overview')
  async getMarketOverview() {
    return this.service.getMarketOverview();
  }
}

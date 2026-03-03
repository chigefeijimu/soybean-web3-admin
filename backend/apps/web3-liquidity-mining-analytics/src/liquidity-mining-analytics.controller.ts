import { Controller, Get, Post, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { LiquidityMiningAnalyticsService } from './liquidity-mining-analytics.service';

@Controller('liquidity-mining')
export class LiquidityMiningAnalyticsController {
  constructor(private readonly service: LiquidityMiningAnalyticsService) {}

  @Get('pools')
  async getPools(
    @Query('chain') chain?: string,
    @Query('protocol') protocol?: string,
    @Query('minApy') minApy?: string,
    @Query('minTvl') minTvl?: string,
    @Query('riskLevel') riskLevel?: string,
  ) {
    const filters = {
      chain,
      protocol,
      minApy: minApy ? parseFloat(minApy) : undefined,
      minTvl: minTvl ? parseFloat(minTvl) : undefined,
      riskLevel,
    };
    return {
      success: true,
      data: await this.service.getPools(filters),
    };
  }

  @Get('pools/top')
  async getTopPools(
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'apy' | 'tvl' | 'volume',
  ) {
    return {
      success: true,
      data: await this.service.getTopPools(
        limit ? parseInt(limit) : 10,
        sortBy || 'apy',
      ),
    };
  }

  @Get('pool/:id')
  async getPoolById(@Param('id') id: string) {
    const pool = await this.service.getPoolById(id);
    return {
      success: true,
      data: pool,
    };
  }

  @Get('stats')
  async getStats() {
    return {
      success: true,
      data: await this.service.getStats(),
    };
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  async comparePools(@Body() body: { pool1Id: string; pool2Id: string }) {
    const result = await this.service.comparePools(body.pool1Id, body.pool2Id);
    return {
      success: !!result,
      data: result,
    };
  }

  @Post('roi')
  @HttpCode(HttpStatus.OK)
  async calculateROI(
    @Body()
    body: {
      principal: number;
      apy: number;
      days: number;
      compoundFrequency?: 'daily' | 'weekly' | 'monthly';
    },
  ) {
    return {
      success: true,
      data: await this.service.calculateROI(
        body.principal,
        body.apy,
        body.days,
        body.compoundFrequency || 'daily',
      ),
    };
  }

  @Get('search')
  async searchPools(@Query('q') query: string) {
    return {
      success: true,
      data: await this.service.searchPools(query),
    };
  }

  @Get('chains')
  async getSupportedChains() {
    return {
      success: true,
      data: this.service.getSupportedChains(),
    };
  }

  @Get('protocols')
  async getSupportedProtocols() {
    return {
      success: true,
      data: this.service.getSupportedProtocols(),
    };
  }
}

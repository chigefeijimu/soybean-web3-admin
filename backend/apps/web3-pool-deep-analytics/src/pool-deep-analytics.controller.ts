import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PoolDeepAnalyticsService } from './pool-deep-analytics.service';

class PoolDepthDto {
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  depthLevels?: number;
}

class ImpermanentLossDto {
  token0Amount: number;
  token1Amount: number;
  initialPrice: number;
  currentPrice: number;
}

class RangeOrderDto {
  token0Address: string;
  token1Address: string;
  currentPrice: number;
  volatility?: 'low' | 'medium' | 'high';
}

class PriceImpactDto {
  poolAddress: string;
  tokenIn: string;
  amountIn: number;
}

class HistoricalILDto {
  token0Address: string;
  token1Address: string;
  days?: number;
}

class ComparePoolsDto {
  poolAddresses: string[];
}

@Controller('pool-deep-analytics')
export class PoolDeepAnalyticsController {
  constructor(private readonly poolAnalyticsService: PoolDeepAnalyticsService) {}

  @Get('depth')
  async getPoolDepth(
    @Query('poolAddress') poolAddress: string,
    @Query('token0Address') token0Address: string,
    @Query('token1Address') token1Address: string,
    @Query('depthLevels') depthLevels?: string,
  ) {
    return this.poolAnalyticsService.getPoolDepth(
      poolAddress,
      token0Address,
      token1Address,
      depthLevels ? parseInt(depthLevels) : 10,
    );
  }

  @Post('impermanent-loss')
  async calculateImpermanentLoss(@Body() dto: ImpermanentLossDto) {
    return this.poolAnalyticsService.calculateImpermanentLoss(
      dto.token0Amount,
      dto.token1Amount,
      dto.initialPrice,
      dto.currentPrice,
    );
  }

  @Post('range-order')
  async getRangeOrderRecommendation(@Body() dto: RangeOrderDto) {
    return this.poolAnalyticsService.getRangeOrderRecommendation(
      dto.token0Address,
      dto.token1Address,
      dto.currentPrice,
      dto.volatility || 'medium',
    );
  }

  @Get('efficiency/:poolAddress')
  async getPoolEfficiency(@Param('poolAddress') poolAddress: string) {
    return this.poolAnalyticsService.getPoolEfficiency(poolAddress);
  }

  @Post('price-impact')
  async calculatePriceImpact(@Body() dto: PriceImpactDto) {
    return this.poolAnalyticsService.calculatePriceImpact(
      dto.poolAddress,
      dto.tokenIn,
      dto.amountIn,
    );
  }

  @Post('historical-il')
  async getHistoricalIL(@Body() dto: HistoricalILDto) {
    return this.poolAnalyticsService.getHistoricalIL(
      dto.token0Address,
      dto.token1Address,
      dto.days || 30,
    );
  }

  @Get('health/:poolAddress')
  async getPoolHealthScore(@Param('poolAddress') poolAddress: string) {
    return this.poolAnalyticsService.getPoolHealthScore(poolAddress);
  }

  @Post('compare')
  async comparePools(@Body() dto: ComparePoolsDto) {
    return this.poolAnalyticsService.comparePools(dto.poolAddresses);
  }

  @Get('dashboard')
  async getDashboard() {
    // Return overview dashboard
    const topPools = [
      { address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', tvl: '125.5M', volume24h: '89.2M', apr: '24.5%' },
      { address: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed', tvl: '45.2M', volume24h: '32.1M', apr: '18.2%' },
      { address: '0x4e68cc9b3c95b9d7ae77d42d4d9e9a0c9f4a7c00', tvl: '38.7M', volume24h: '28.5M', apr: '21.3%' },
    ];
    
    const marketStats = {
      totalTVL: '12.5B',
      totalVolume24h: '8.2B',
      avgAPR: '18.5%',
      poolCount: 15420,
    };
    
    return {
      topPools,
      marketStats,
      timestamp: Date.now(),
    };
  }
}

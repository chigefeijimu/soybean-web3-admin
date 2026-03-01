import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Web3GasOptimizerService } from './web3-gas-optimizer.service';

@ApiTags('Web3 Gas Optimizer')
@Controller('web3/gas-optimizer')
export class Web3GasOptimizerController {
  constructor(private readonly gasOptimizerService: Web3GasOptimizerService) {}

  @Get('recommend')
  @ApiOperation({ summary: '获取最佳Gas价格建议' })
  async getRecommendation(
    @Query('chainId') chainId: number = 1,
    @Query('urgency') urgency: 'low' | 'normal' | 'high' = 'normal',
  ) {
    return this.gasOptimizerService.getRecommendation(chainId, urgency);
  }

  @Get('schedule')
  @ApiOperation({ summary: '获取最佳交易时间段' })
  async getBestSchedule(
    @Query('chainId') chainId: number = 1,
    @Query('days') days: number = 7,
  ) {
    return this.gasOptimizerService.getBestSchedule(chainId, days);
  }

  @Get('trends')
  @ApiOperation({ summary: '获取Gas价格趋势分析' })
  async getTrends(
    @Query('chainId') chainId: number = 1,
    @Query('hours') hours: number = 168, // 一周
  ) {
    return this.gasOptimizerService.getTrends(chainId, hours);
  }

  @Get('predict')
  @ApiOperation({ summary: '预测未来Gas价格' })
  async predict(
    @Query('chainId') chainId: number = 1,
    @Query('hoursAhead') hoursAhead: number = 4,
  ) {
    return this.gasOptimizerService.predictGasPrice(chainId, hoursAhead);
  }

  @Get('savings')
  @ApiOperation({ summary: '计算Gas费用节省' })
  async calculateSavings(
    @Query('chainId') chainId: number = 1,
    @Query('gasLimit') gasLimit: number = 21000,
    @Query('useOptimizer') useOptimizer: boolean = true,
  ) {
    return this.gasOptimizerService.calculateSavings(chainId, gasLimit, useOptimizer);
  }
}

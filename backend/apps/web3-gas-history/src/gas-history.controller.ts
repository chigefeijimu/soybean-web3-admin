import { Controller, Get, Query } from '@nestjs/common';
import { GasHistoryService } from './gas-history.service';

@Controller('gas-history')
export class GasHistoryController {
  constructor(private readonly gasHistoryService: GasHistoryService) {}

  @Get('current')
  async getCurrentGasPrices(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.gasHistoryService.getCurrentGasPrices(chainIdNum);
  }

  @Get('historical')
  async getHistoricalGasPrices(
    @Query('chainId') chainId?: string,
    @Query('days') days?: string,
  ) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.gasHistoryService.getHistoricalGasPrices(chainIdNum, daysNum);
  }

  @Get('hourly')
  async getHourlyGasPrices(
    @Query('chainId') chainId?: string,
    @Query('hours') hours?: string,
  ) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.gasHistoryService.getHourlyGasPrices(chainIdNum, hoursNum);
  }

  @Get('stats')
  async getGasStats(
    @Query('chainId') chainId?: string,
    @Query('days') days?: string,
  ) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.gasHistoryService.getGasStats(chainIdNum, daysNum);
  }

  @Get('best-hours')
  async getBestTradingHours(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.gasHistoryService.getBestTradingHours(chainIdNum);
  }

  @Get('prediction')
  async getGasPrediction(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.gasHistoryService.getGasPrediction(chainIdNum);
  }

  @Get('chains')
  async getSupportedChains() {
    return this.gasHistoryService.getSupportedChains();
  }

  @Get('compare')
  async compareChainsGas() {
    return this.gasHistoryService.compareChainsGas();
  }

  @Get('recommendation')
  async getRecommendation(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const prediction = await this.gasHistoryService.getGasPrediction(chainIdNum);
    return {
      recommendation: prediction.recommendation,
      currentPrices: prediction.current,
      predictedTrend: prediction.predicted.trend,
    };
  }
}

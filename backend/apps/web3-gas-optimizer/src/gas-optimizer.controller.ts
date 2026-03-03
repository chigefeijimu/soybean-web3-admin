import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GasOptimizerService, GasPredictionRequest, GasComparisonRequest, GasSavingRequest } from './gas-optimizer.service';

@Controller('api/gas-optimizer')
export class GasOptimizerController {
  constructor(private readonly gasOptimizerService: GasOptimizerService) {}

  // Get current gas prices for all supported chains
  @Get('prices')
  async getGasPrices(@Query('chains') chains?: string) {
    const chainList = chains ? chains.split(',') : undefined;
    const result = await this.gasOptimizerService.getGasPrices(chainList);
    return { success: true, data: result };
  }

  // Get gas price predictions
  @Post('predict')
  async predictGasPrice(@Body() request: GasPredictionRequest) {
    const result = await this.gasOptimizerService.predictGasPrice(request);
    return { success: true, data: result };
  }

  // Compare gas prices across chains
  @Post('compare')
  async compareGasPrices(@Body() request: GasComparisonRequest) {
    const result = await this.gasOptimizerService.compareGasPrices(request);
    return { success: true, data: result };
  }

  // Get gas saving recommendations
  @Post('savings')
  async getGasSavings(@Body() request: GasSavingRequest) {
    const result = await this.gasOptimizerService.getGasSavings(request);
    return { success: true, data: result };
  }

  // Get best time to transact
  @Get('best-time')
  async getBestTime(@Query('chain') chain?: string) {
    const result = await this.gasOptimizerService.getBestTimeToTransact(chain);
    return { success: true, data: result };
  }

  // Get gas price history
  @Get('history')
  async getGasHistory(
    @Query('chain') chain: string,
    @Query('range') range?: string,
  ) {
    const result = await this.gasOptimizerService.getGasHistory(chain, range || '24h');
    return { success: true, data: result };
  }

  // Get gas fee estimates for different transaction types
  @Get('fee-estimate')
  async getFeeEstimates(
    @Query('chain') chain: string,
    @Query('txType') txType?: string,
  ) {
    const result = await this.gasOptimizerService.getFeeEstimates(chain, txType);
    return { success: true, data: result };
  }

  // Get supported chains
  @Get('chains')
  async getSupportedChains() {
    const result = this.gasOptimizerService.getSupportedChains();
    return { success: true, data: result };
  }

  // Health check
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'Gas Optimizer API',
      timestamp: Date.now(),
    };
  }
}

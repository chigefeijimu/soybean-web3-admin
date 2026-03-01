import { Controller, Get, Query, Param } from '@nestjs/common';
import { GasAnalyzerService, GasPrice, GasPrediction, ChainGasInfo, GasHistoryPoint } from './gas-analyzer.service';

@Controller('gas-analyzer')
export class GasAnalyzerController {
  constructor(private readonly gasAnalyzerService: GasAnalyzerService) {}

  @Get('current')
  async getCurrentGas(
    @Query('chainId') chainId?: string,
  ): Promise<GasPrice[]> {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.gasAnalyzerService.getCurrentGasPrices(chainIdNum);
  }

  @Get('history')
  async getGasHistory(
    @Query('chainId') chainId?: string,
    @Query('days') days?: string,
  ): Promise<GasHistoryPoint[]> {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.gasAnalyzerService.getGasHistory(chainIdNum, Math.min(daysNum, 30));
  }

  @Get('prediction')
  async getGasPrediction(
    @Query('chainId') chainId?: string,
  ): Promise<GasPrediction> {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.gasAnalyzerService.getGasPrediction(chainIdNum);
  }

  @Get('multi-chain')
  async getMultiChainGas(): Promise<ChainGasInfo[]> {
    return this.gasAnalyzerService.getMultiChainGasInfo();
  }

  @Get('fee-calculate')
  async calculateFee(
    @Query('chainId') chainId?: string,
    @Query('gasLimit') gasLimit?: string,
    @Query('speed') speed?: 'slow' | 'standard' | 'fast',
  ): Promise<{ fee: string; feeUsd: string; gasPrice: string }> {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const gasLimitNum = gasLimit ? parseInt(gasLimit, 10) : 21000;
    const speedVal = speed || 'standard';
    return this.gasAnalyzerService.calculateTransactionFee(chainIdNum, gasLimitNum, speedVal);
  }
}

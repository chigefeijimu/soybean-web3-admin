import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DefiGasEstimatorService, GasEstimate, DefiOperation } from './defi-gas-estimator.service';

@Controller('web3/defi-gas-estimator')
export class DefiGasEstimatorController {
  constructor(private readonly defiGasEstimatorService: DefiGasEstimatorService) {}

  /**
   * Estimate gas for a single DeFi operation
   */
  @Get('estimate')
  async estimateGas(
    @Query('operation') operation: string,
    @Query('protocol') protocol: string,
    @Query('chainId') chainId: number,
    @Query('speed') speed: 'slow' | 'normal' | 'fast' = 'normal'
  ): Promise<GasEstimate> {
    return this.defiGasEstimatorService.estimateGas(
      operation,
      protocol,
      chainId || 1,
      speed
    );
  }

  /**
   * Batch estimate gas for multiple operations
   */
  @Post('batch')
  async batchEstimate(
    @Body() body: {
      operations: DefiOperation[];
      speed?: 'slow' | 'normal' | 'fast';
    }
  ): Promise<GasEstimate[]> {
    return this.defiGasEstimatorService.estimateMultipleOperations(
      body.operations,
      body.speed || 'normal'
    );
  }

  /**
   * Compare gas costs across chains
   */
  @Get('compare')
  async compareChains(
    @Query('chains') chains: string,
    @Query('operation') operation: string,
    @Query('protocol') protocol: string,
    @Query('speed') speed: 'slow' | 'normal' | 'fast' = 'normal'
  ): Promise<GasEstimate[]> {
    const chainIds = chains.split(',').map(c => parseInt(c.trim()));
    return this.defiGasEstimatorService.getGasComparison(
      chainIds,
      operation,
      protocol,
      speed
    );
  }

  /**
   * Get supported operations
   */
  @Get('operations')
  getSupportedOperations() {
    return this.defiGasEstimatorService.getSupportedOperations();
  }

  /**
   * Get supported chains
   */
  @Get('chains')
  getSupportedChains() {
    return this.defiGasEstimatorService.getSupportedChains();
  }

  /**
   * Quick estimate for common operations
   */
  @Get('quick/:operation')
  async quickEstimate(
    @Param('operation') operation: string,
    @Query('chainId') chainId: number,
    @Query('speed') speed: 'slow' | 'normal' | 'fast' = 'normal'
  ): Promise<GasEstimate> {
    // Default to eth-transfer for simple transfers
    const protocol = operation === 'transfer' ? 'erc20' : 'uniswap-v3';
    return this.defiGasEstimatorService.estimateGas(
      operation,
      protocol,
      chainId || 1,
      speed
    );
  }
}

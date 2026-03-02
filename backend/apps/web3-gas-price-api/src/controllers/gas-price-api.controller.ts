import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { GasPriceApiService, ChainGasPrice, GasPrediction, GasHistoryPoint } from './services/gas-price-api.service';

@Controller('api/gas-price')
export class GasPriceApiController {
  constructor(private readonly gasPriceService: GasPriceApiService) {}

  @Get('chains')
  async getSupportedChains() {
    return {
      success: true,
      data: [
        { chainId: 1, chainName: 'Ethereum', symbol: 'ETH' },
        { chainId: 137, chainName: 'Polygon', symbol: 'MATIC' },
        { chainId: 42161, chainName: 'Arbitrum', symbol: 'ETH' },
        { chainId: 10, chainName: 'Optimism', symbol: 'ETH' },
        { chainId: 56, chainName: 'BSC', symbol: 'BNB' },
        { chainId: 8453, chainName: 'Base', symbol: 'ETH' },
      ],
    };
  }

  @Get(':chainId')
  async getGasPrice(@Param('chainId') chainId: string): Promise<{ success: boolean; data: ChainGasPrice }> {
    const chainIdNum = parseInt(chainId, 10);
    
    if (isNaN(chainIdNum)) {
      throw new NotFoundException('Invalid chain ID');
    }

    const gasPrice = await this.gasPriceService.getGasPrice(chainIdNum);
    
    if (!gasPrice) {
      throw new NotFoundException(`Gas price not available for chain ${chainId}`);
    }

    return {
      success: true,
      data: gasPrice,
    };
  }

  @Get()
  async getAllGasPrices(): Promise<{ success: boolean; data: ChainGasPrice[] }> {
    const gasPrices = await this.gasPriceService.getAllGasPrices();
    
    return {
      success: true,
      data: gasPrices,
    };
  }

  @Get(':chainId/prediction')
  async getGasPrediction(@Param('chainId') chainId: string): Promise<{ success: boolean; data: GasPrediction }> {
    const chainIdNum = parseInt(chainId, 10);
    
    if (isNaN(chainIdNum)) {
      throw new NotFoundException('Invalid chain ID');
    }

    const prediction = await this.gasPriceService.getGasPrediction(chainIdNum);
    
    if (!prediction) {
      throw new NotFoundException(`Gas prediction not available for chain ${chainId}`);
    }

    return {
      success: true,
      data: prediction,
    };
  }

  @Get(':chainId/history')
  async getGasHistory(
    @Param('chainId') chainId: string,
    @Query('hours') hours?: string,
  ): Promise<{ success: boolean; data: GasHistoryPoint[] }> {
    const chainIdNum = parseInt(chainId, 10);
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    
    if (isNaN(chainIdNum)) {
      throw new NotFoundException('Invalid chain ID');
    }

    const history = await this.gasPriceService.getGasHistory(chainIdNum, hoursNum);
    
    return {
      success: true,
      data: history,
    };
  }

  @Get(':chainId/optimal')
  async getOptimalTime(
    @Param('chainId') chainId: string,
  ): Promise<{ 
    success: boolean; 
    data: { 
      bestTime: string; 
      estimatedGas: string; 
      confidence: number 
    } 
  }> {
    const chainIdNum = parseInt(chainId, 10);
    
    if (isNaN(chainIdNum)) {
      throw new NotFoundException('Invalid chain ID');
    }

    const optimal = await this.gasPriceService.getOptimalGasTime(chainIdNum);
    
    return {
      success: true,
      data: optimal,
    };
  }
}

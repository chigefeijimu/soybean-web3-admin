import { Controller, Get, Query, Param } from '@nestjs/common';
import { GasPricePredictionService } from './gas-price-prediction.service';

@Controller('api/gas-price-prediction')
export class GasPricePredictionController {
  constructor(private readonly gasPricePredictionService: GasPricePredictionService) {}

  @Get()
  getPrediction(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : undefined;
    return this.gasPricePredictionService.getPrediction(chainIdNum);
  }

  @Get('historical/:chainId')
  getHistorical(
    @Param('chainId') chainId: string,
    @Query('hours') hours: string = '24',
  ) {
    return this.gasPricePredictionService.getHistorical(
      parseInt(chainId, 10),
      parseInt(hours, 10),
    );
  }

  @Get('analysis/:chainId')
  getAnalysis(@Param('chainId') chainId: string) {
    return this.gasPricePredictionService.getAnalysis(parseInt(chainId, 10));
  }

  @Get('chains')
  getChains() {
    return [
      { id: 1, name: 'Ethereum', symbol: 'ETH' },
      { id: 137, name: 'Polygon', symbol: 'MATIC' },
      { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
      { id: 10, name: 'Optimism', symbol: 'ETH' },
      { id: 56, name: 'BNB Chain', symbol: 'BNB' },
      { id: 8453, name: 'Base', symbol: 'ETH' },
      { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    ];
  }
}

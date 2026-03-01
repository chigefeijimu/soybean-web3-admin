import { Controller, Get, Query } from '@nestjs/common';
import { BlockchainHeatmapService } from './blockchain-heatmap.service';

@Controller('blockchain-heatmap')
export class BlockchainHeatmapController {
  constructor(private readonly heatmapService: BlockchainHeatmapService) {}

  @Get('networks')
  async getNetworksHeatmap() {
    return this.heatmapService.getNetworksHeatmap();
  }

  @Get('network/:chainId')
  async getNetworkDetails(@Query('chainId') chainId: string) {
    return this.heatmapService.getNetworkDetails(Number(chainId));
  }

  @Get('history')
  async getHeatmapHistory(
    @Query('chainId') chainId?: string,
    @Query('period') period: string = '24h'
  ) {
    return this.heatmapService.getHeatmapHistory(chainId, period);
  }

  @Get('gas-prices')
  async getGasPrices() {
    return this.heatmapService.getGasPricesAcrossChains();
  }
}

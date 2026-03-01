import { Controller, Get, Query } from '@nestjs/common';
import { DataVizService } from './web3-data-viz.service';

@Controller('web3/data-viz')
export class DataVizController {
  constructor(private readonly dataVizService: DataVizService) {}

  @Get('network-status')
  async getNetworkStatus(@Query('chainId') chainId?: string) {
    return this.dataVizService.getNetworkStatus(chainId ? parseInt(chainId, 10) : 1);
  }

  @Get('large-transactions')
  async getLargeTransactions(
    @Query('limit') limit?: string,
    @Query('minValue') minValue?: string
  ) {
    return this.dataVizService.getLargeTransactions(
      limit ? parseInt(limit, 10) : 20,
      minValue ? parseFloat(minValue) : 10000
    );
  }

  @Get('popular-tokens')
  async getPopularTokens() {
    return this.dataVizService.getPopularTokens();
  }

  @Get('active-addresses')
  async getActiveAddresses(@Query('limit') limit?: string) {
    return this.dataVizService.getActiveAddresses(limit ? parseInt(limit, 10) : 15);
  }

  @Get('network-stats')
  async getNetworkStats() {
    return this.dataVizService.getNetworkStats();
  }

  @Get('multi-chain')
  async getMultiChainData() {
    return this.dataVizService.getMultiChainData();
  }

  @Get('tps-history')
  async getHistoricalTPS(@Query('period') period?: string) {
    return this.dataVizService.getHistoricalTPS(period || '24h');
  }

  @Get('gas-history')
  async getGasHistory(@Query('period') period?: string) {
    return this.dataVizService.getGasHistory(period || '24h');
  }
}

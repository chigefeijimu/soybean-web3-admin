import { Controller, Get, Query } from '@nestjs/common';
import { MevExplorerService, MevTransaction, MevStats, GasAnalysis } from './mev-explorer.service';

@Controller('mev-explorer')
export class MevExplorerController {
  constructor(private readonly mevService: MevExplorerService) {}

  @Get('transactions')
  async getRecentTransactions(@Query('limit') limit?: string): Promise<MevTransaction[]> {
    return this.mevService.getRecentTransactions(limit ? parseInt(limit) : 50);
  }

  @Get('stats')
  async getMevStats(): Promise<MevStats> {
    return this.mevService.getMevStats();
  }

  @Get('gas-analysis')
  async getGasAnalysis(): Promise<GasAnalysis> {
    return this.mevService.getGasAnalysis();
  }

  @Get('top-bots')
  async getTopBots(@Query('limit') limit?: string) {
    return this.mevService.getTopBots(limit ? parseInt(limit) : 10);
  }

  @Get('by-type')
  async getMevByType(@Query('type') type?: MevTransaction['type']) {
    return this.mevService.getMevByType(type);
  }

  @Get('search')
  async searchByAddress(@Query('address') address: string) {
    return this.mevService.searchByAddress(address);
  }

  @Get('history')
  async getHistoricalData(@Query('period') period: string = '24h') {
    return this.mevService.getHistoricalData(period);
  }
}

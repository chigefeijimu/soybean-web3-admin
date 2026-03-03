import { Controller, Get, Query } from '@nestjs/common';
import { DexTradingJournalService, DexTrade, TradingStats } from './dex-trading-journal.service';

@Controller('dex-trading-journal')
export class DexTradingJournalController {
  constructor(private readonly dexTradingJournalService: DexTradingJournalService) {}

  @Get('trades')
  async getDexTrades(
    @Query('address') address: string,
    @Query('chain') chain?: string,
    @Query('dex') dex?: string,
  ): Promise<DexTrade[]> {
    if (!address) {
      throw new Error('Address is required');
    }
    return this.dexTradingJournalService.getDexTrades(address, chain, dex);
  }

  @Get('stats')
  async getTradingStats(
    @Query('address') address: string,
    @Query('chain') chain?: string,
    @Query('dex') dex?: string,
  ): Promise<TradingStats> {
    if (!address) {
      throw new Error('Address is required');
    }
    return this.dexTradingJournalService.getTradingStats(address, chain, dex);
  }

  @Get('top-traders')
  async getTopTraders(
    @Query('chain') chain?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dexTradingJournalService.getTopTraders(
      chain,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('dex-performance')
  async getDexPerformance(@Query('chain') chain?: string) {
    return this.dexTradingJournalService.getDexPerformance(chain);
  }

  @Get('trending-pairs')
  async getTrendingPairs(@Query('chain') chain: string = 'ethereum') {
    return this.dexTradingJournalService.getTrendingPairs(chain);
  }
}

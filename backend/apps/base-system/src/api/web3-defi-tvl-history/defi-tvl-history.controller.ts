import { Controller, Get, Query, Param } from '@nestjs/common';
import { DefiTvlHistoryService } from './defi-tvl-history.service';
import { DefiTvlHistoryQueryDto, ProtocolTvlHistoryDto, TvlTrendDto, TvlStatisticsDto } from './defi-tvl-history.dto';

@Controller('defi-tvl-history')
export class DefiTvlHistoryController {
  constructor(private readonly defiTvlHistoryService: DefiTvlHistoryService) {}

  @Get('protocol/:protocol')
  async getProtocolTvlHistory(
    @Param('protocol') protocol: string,
    @Query() query: DefiTvlHistoryQueryDto,
  ): Promise<ProtocolTvlHistoryDto> {
    return this.defiTvlHistoryService.getTvlHistory({
      protocol,
      chain: query.chain,
      timeframe: query.timeframe,
    });
  }

  @Get('trends')
  async getTvlTrends(): Promise<TvlTrendDto[]> {
    return this.defiTvlHistoryService.getTvlTrends();
  }

  @Get('statistics')
  async getTvlStatistics(
    @Query('chain') chain?: string,
  ): Promise<TvlStatisticsDto> {
    return this.defiTvlHistoryService.getTvlStatistics(chain);
  }

  @Get('chain/:chain')
  async getChainTvlHistory(
    @Param('chain') chain: string,
    @Query('timeframe') timeframe?: string,
  ): Promise<{ chain: string; history: { date: string; tvl: number }[] }> {
    return this.defiTvlHistoryService.getChainTvlHistory(chain, timeframe);
  }

  @Get('search')
  async searchProtocols(
    @Query('q') query: string,
  ): Promise<{ name: string; chain: string; tvl: number }[]> {
    return this.defiTvlHistoryService.searchProtocols(query);
  }
}

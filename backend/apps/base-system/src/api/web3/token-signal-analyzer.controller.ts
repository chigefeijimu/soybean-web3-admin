import { Controller, Get, Query } from '@nestjs/common';
import { TokenSignalAnalyzerService, TradingSignal, MultiTimeframeSignals } from './token-signal-analyzer.service';

@Controller('web3/token-signal')
export class TokenSignalAnalyzerController {
  constructor(private readonly appService: TokenSignalAnalyzerService) {}

  @Get('signal')
  async getSignal(
    @Query('token') token: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('timeframe') timeframe: string = '1d'
  ): Promise<TradingSignal> {
    return this.appService.getTradingSignal(token, chain, timeframe);
  }

  @Get('signals/multiple')
  async getMultiTimeframeSignals(
    @Query('token') token: string,
    @Query('chain') chain: string = 'ethereum'
  ): Promise<MultiTimeframeSignals> {
    return this.appService.getMultiTimeframeSignals(token, chain);
  }

  @Get('signals/top')
  async getTopSignals(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: number = 10
  ): Promise<TradingSignal[]> {
    return this.appService.getTopSignals(chain, limit);
  }

  @Get('tokens/popular')
  getPopularTokens(): string[] {
    return this.appService.getPopularTokens();
  }
}

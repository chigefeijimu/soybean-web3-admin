import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { BacktesterService, BacktestConfig, BacktestResult } from './backtester.service';

@Controller('api/strategy-backtester')
export class BacktesterController {
  constructor(private readonly backtesterService: BacktesterService) {}

  @Post('backtest')
  async runBacktest(@Body() config: BacktestConfig): Promise<BacktestResult> {
    return this.backtesterService.runBacktest(config);
  }

  @Get('strategies')
  getAvailableStrategies(): string[] {
    return this.backtesterService.getAvailableStrategies();
  }

  @Get('tokens')
  getAvailableTokens(): string[] {
    return this.backtesterService.getAvailableTokens();
  }

  @Get('chains')
  getAvailableChains(): string[] {
    return this.backtesterService.getAvailableChains();
  }

  @Get('health')
  health(): { status: string; timestamp: string } {
    return {
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  }
}

import { Controller, Get, Query, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('momentum')
  async getTokenMomentum(
    @Query('chain') chain?: string,
    @Query('timeRange') timeRange?: string,
    @Query('momentumType') momentumType?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.getTokenMomentum({
      chain,
      timeRange,
      momentumType,
      sortBy,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('momentum/address/:address')
  async getTokenMomentumByAddress(
    @Param('address') address: string,
    @Query('chain') chain?: string,
  ) {
    const result = await this.appService.getTokenMomentumByAddress(address, chain);
    if (!result) {
      return { error: 'Token not found or insufficient data' };
    }
    return result;
  }

  @Get('momentum/signals')
  async getMomentumSignals(
    @Query('timeRange') timeRange?: string,
  ) {
    return this.appService.getMomentumSignals(timeRange);
  }

  @Get('momentum/top')
  async getTopMomentumTokens(
    @Query('chain') chain?: string,
    @Query('timeRange') timeRange?: string,
    @Query('signal') signal?: string,
    @Query('limit') limit?: string,
  ) {
    return this.appService.getTopMomentumTokens({
      chain,
      timeRange,
      signal,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}

import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { SmartMoneyService } from './smart-money.service';

@Controller()
export class SmartMoneyController {
  constructor(private readonly smartMoneyService: SmartMoneyService) {}

  @Get('protocols')
  async getProtocolFlows(
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.smartMoneyService.getProtocolFlows(chain);
  }

  @Get('transactions')
  async getWhaleTransactions(
    @Query('address') address?: string,
    @Query('limit') limit: string = '20',
  ) {
    return this.smartMoneyService.getWhaleTransactions(address, parseInt(limit));
  }

  @Get('summary')
  async getFlowSummary(
    @Query('chain') chain: string = 'ethereum',
    @Query('period') period: string = '24h',
  ) {
    return this.smartMoneyService.getFlowSummary(chain, period);
  }

  @Get('alerts')
  async getAlerts(
    @Query('limit') limit: string = '10',
  ) {
    return this.smartMoneyService.getAlerts(parseInt(limit));
  }

  @Get('history')
  async getHistoricalFlow(
    @Query('chain') chain: string = 'ethereum',
    @Query('days') days: string = '7',
  ) {
    return this.smartMoneyService.getHistoricalFlow(chain, parseInt(days));
  }

  @Get('tokens')
  async getTokenFlows(
    @Query('token') token?: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.smartMoneyService.getTokenFlows(token, chain);
  }

  @Post('track')
  async trackAddress(
    @Body('address') address: string,
  ) {
    return this.smartMoneyService.trackAddress(address);
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'Smart Money Flow Tracker',
      timestamp: new Date().toISOString(),
    };
  }
}

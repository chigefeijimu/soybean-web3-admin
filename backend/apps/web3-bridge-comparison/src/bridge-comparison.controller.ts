import { Controller, Get, Query } from '@nestjs/common';
import { BridgeComparisonService } from './bridge-comparison.service';

@Controller('web3/bridge-comparison')
export class BridgeComparisonController {
  constructor(private readonly bridgeComparisonService: BridgeComparisonService) {}

  @Get('bridges')
  async getSupportedBridges() {
    return this.bridgeComparisonService.getSupportedBridges();
  }

  @Get('bridge')
  async getBridgeByName(@Query('name') name: string) {
    return this.bridgeComparisonService.getBridgeByName(name);
  }

  @Get('chains')
  async getChainsForBridge(@Query('bridge') bridge: string) {
    return this.bridgeComparisonService.getChainsForBridge(bridge);
  }

  @Get('quotes')
  async getQuotes(
    @Query('from') fromChain: string,
    @Query('to') toChain: string,
    @Query('token') token: string,
    @Query('amount') amount: number,
  ) {
    return this.bridgeComparisonService.getQuotes(fromChain, toChain, token, amount);
  }

  @Get('best-quote')
  async getBestQuote(
    @Query('from') fromChain: string,
    @Query('to') toChain: string,
    @Query('token') token: string,
    @Query('amount') amount: number,
  ) {
    return this.bridgeComparisonService.getBestQuote(fromChain, toChain, token, amount);
  }

  @Get('compare')
  async compareBridges(
    @Query('from') fromChain: string,
    @Query('to') toChain: string,
    @Query('token') token: string,
    @Query('amount') amount: number,
  ) {
    return this.bridgeComparisonService.compareBridges(fromChain, toChain, token, amount);
  }

  @Get('stats')
  async getBridgeStatistics(@Query('bridge') bridge: string) {
    return this.bridgeComparisonService.getBridgeStatistics(bridge);
  }

  @Get('popular-routes')
  async getPopularRoutes() {
    return this.bridgeComparisonService.getPopularRoutes();
  }
}

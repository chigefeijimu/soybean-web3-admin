import { Controller, Get, Query } from '@nestjs/common';
import { TokenBalanceHistoryService } from './token-balance-history.service';

@Controller('api/token-balance-history')
export class TokenBalanceHistoryController {
  constructor(private readonly service: TokenBalanceHistoryService) {}

  @Get('balance')
  async getBalanceHistory(
    @Query('address') address: string,
    @Query('chainId') chainId?: string,
    @Query('tokenAddress') tokenAddress?: string,
    @Query('timeRange') timeRange: string = '30d',
  ) {
    return this.service.getBalanceHistory(address, chainId, tokenAddress, timeRange);
  }

  @Get('portfolio-snapshots')
  async getPortfolioSnapshots(
    @Query('address') address: string,
    @Query('chains') chains?: string,
    @Query('timeRange') timeRange: string = '30d',
  ) {
    const chainList = chains ? chains.split(',') : undefined;
    return this.service.getPortfolioSnapshots(address, chainList, timeRange);
  }

  @Get('balance-changes')
  async getBalanceChanges(
    @Query('address') address: string,
    @Query('minChange') minChange: string = '10',
    @Query('timeRange') timeRange: string = '7d',
  ) {
    return this.service.getBalanceChanges(address, parseFloat(minChange), timeRange);
  }

  @Get('top-holders')
  async getTopHolders(
    @Query('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
    @Query('date') date?: string,
  ) {
    return this.service.getTopHolders(tokenAddress, chainId, date);
  }

  @Get('distribution')
  async getDistribution(
    @Query('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
  ) {
    return this.service.getDistribution(tokenAddress, chainId);
  }

  @Get('statistics')
  async getStatistics(
    @Query('address') address: string,
    @Query('chainId') chainId?: string,
  ) {
    return this.service.getStatistics(address, chainId);
  }

  @Get('dashboard')
  async getDashboard(
    @Query('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains ? chains.split(',') : undefined;
    return this.service.getDashboard(address, chainList);
  }
}

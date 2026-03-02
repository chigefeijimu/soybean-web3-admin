import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WalletActivityService } from './wallet-activity.service';

@Controller('wallet-activity')
export class WalletActivityController {
  constructor(private readonly walletActivityService: WalletActivityService) {}

  @Get('analyze')
  async analyzeWallet(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1'
  ) {
    return this.walletActivityService.analyzeWalletActivity(address, chainId);
  }

  @Get('gas-stats')
  async getGasStats(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1'
  ) {
    return this.walletActivityService.getGasStats(address, chainId);
  }

  @Get('activity-heatmap')
  async getActivityHeatmap(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1'
  ) {
    return this.walletActivityService.getActivityHeatmap(address, chainId);
  }

  @Get('transaction-patterns')
  async getTransactionPatterns(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1'
  ) {
    return this.walletActivityService.getTransactionPatterns(address, chainId);
  }

  @Get('hourly-stats')
  async getHourlyStats(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1'
  ) {
    return this.walletActivityService.getHourlyStats(address, chainId);
  }

  @Get('weekly-stats')
  async getWeeklyStats(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1'
  ) {
    return this.walletActivityService.getWeeklyStats(address, chainId);
  }

  @Get('top-interactions')
  async getTopInteractions(
    @Query('address') address: string,
    @Query('chainId') chainId: string = '1'
  ) {
    return this.walletActivityService.getTopInteractions(address, chainId);
  }

  @Post('track')
  async trackWallet(@Body() body: { address: string; chainId?: string }) {
    return this.walletActivityService.trackWallet(body.address, body.chainId || '1');
  }
}

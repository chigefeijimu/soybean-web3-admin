import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { MevProtectService, ProtectConfig, ProtectionStats } from './mev-protect.service';

@Controller('mev-protect')
export class MevProtectController {
  constructor(private readonly mevProtectService: MevProtectService) {}

  @Get('stats')
  async getStats(): Promise<ProtectionStats> {
    return this.mevProtectService.getProtectionStats();
  }

  @Get('config')
  async getConfig(): Promise<ProtectConfig> {
    return this.mevProtectService.getProtectionConfig();
  }

  @Post('config')
  async updateConfig(@Body() config: Partial<ProtectConfig>): Promise<ProtectConfig> {
    return this.mevProtectService.updateProtectionConfig(config);
  }

  @Get('simulate')
  async simulate(
    @Query('amount') amount: string,
    @Query('tokenIn') tokenIn: string,
    @Query('tokenOut') tokenOut: string
  ) {
    return this.mevProtectService.simulateTransaction(
      parseFloat(amount) || 10000,
      tokenIn || 'WETH',
      tokenOut || 'USDC'
    );
  }

  @Get('recommendations')
  async getRecommendations(@Query('chain') chain?: string) {
    return this.mevProtectService.getRecommendations(chain);
  }

  @Get('relays')
  async getRelays() {
    return this.mevProtectService.getRelays();
  }

  @Get('tips')
  async getTips() {
    return this.mevProtectService.getProtectionTips();
  }

  @Get('history')
  async getHistory(@Query('days') days?: string) {
    return this.mevProtectService.getHistoricalSavings(parseInt(days) || 30);
  }

  @Get('estimate')
  async estimateSavings(
    @Query('amount') amount: string,
    @Query('frequency') frequency: string
  ) {
    return this.mevProtectService.estimateSavings(
      parseFloat(amount) || 10000,
      parseInt(frequency) || 1
    );
  }

  @Get('status')
  async getStatus() {
    return this.mevProtectService.getProtectionStatus();
  }

  @Post('test')
  async testProtection(@Body('txHash') txHash: string) {
    return this.mevProtectService.testProtection(txHash);
  }
}

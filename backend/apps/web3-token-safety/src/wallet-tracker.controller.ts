import { Controller, Get, Query, Param } from '@nestjs/common';
import { WalletTrackerService, WalletTrackerResult } from './wallet-tracker.service';

@Controller('wallet-tracker')
export class WalletTrackerController {
  constructor(private readonly walletTrackerService: WalletTrackerService) {}

  @Get('portfolio/:address')
  async getPortfolio(
    @Param('address') address: string,
    @Query('chainId') chainId: string = '1',
  ): Promise<WalletTrackerResult> {
    return this.walletTrackerService.getWalletPortfolio(
      parseInt(chainId) || 1,
      address,
    );
  }

  @Get('track')
  async trackMultiple(
    @Query('addresses') addresses: string,
    @Query('chainId') chainId: string = '1',
  ): Promise<WalletTrackerResult[]> {
    const addressList = addresses.split(',').map(a => a.trim());
    return this.walletTrackerService.trackMultipleWallets(
      parseInt(chainId) || 1,
      addressList,
    );
  }

  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { WhaleTrackerService, TrackedAddress } from './whale-tracker.service';

@Controller('whale-tracker')
export class WhaleTrackerController {
  constructor(private readonly whaleTrackerService: WhaleTrackerService) {}

  @Get('transactions')
  getTransactions(@Query('limit') limit?: string, @Query('address') address?: string) {
    if (address) {
      return this.whaleTrackerService.getTransactionsByAddress(address);
    }
    return this.whaleTrackerService.generateWhaleTransactions(limit ? parseInt(limit) : 50);
  }

  @Get('stats')
  getStats() {
    return this.whaleTrackerService.getWhaleStats();
  }

  @Get('profiles')
  getProfiles() {
    return this.whaleTrackerService.getWhaleProfiles();
  }

  @Get('alerts')
  getAlerts(@Query('limit') limit?: string) {
    return this.whaleTrackerService.getAlerts(limit ? parseInt(limit) : 20);
  }

  @Get('tracked')
  getTrackedAddresses() {
    return this.whaleTrackerService.getTrackedAddresses();
  }

  @Post('tracked')
  addTrackedAddress(@Body() body: { address: string; label: string; threshold?: number }) {
    return this.whaleTrackerService.addTrackedAddress(
      body.address,
      body.label,
      body.threshold || 10000
    );
  }

  @Delete('tracked/:address')
  removeTrackedAddress(@Param('address') address: string) {
    return { success: this.whaleTrackerService.removeTrackedAddress(address) };
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.whaleTrackerService.searchWhales(query);
  }

  @Get('network-activity')
  getNetworkActivity(@Query('chainId') chainId?: string) {
    return this.whaleTrackerService.getNetworkWhaleActivity(chainId ? parseInt(chainId) : 1);
  }

  @Get('top-whales')
  getTopWhales(@Query('limit') limit?: string) {
    return this.whaleTrackerService.getTopWhalesByVolume(limit ? parseInt(limit) : 10);
  }

  @Get('address/:address')
  getAddressInfo(@Param('address') address: string) {
    const whaleInfo = this.whaleTrackerService.getKnownWhaleInfo(address);
    const exchangeName = this.whaleTrackerService.getExchangeName(address);
    const transactions = this.whaleTrackerService.getTransactionsByAddress(address);
    
    return {
      address,
      label: whaleInfo?.label || exchangeName || 'Unknown',
      type: whaleInfo?.type || (exchangeName ? 'exchange' : 'unknown'),
      isKnown: !!whaleInfo || !!exchangeName,
      transactionCount: transactions.length,
      recentTransactions: transactions.slice(0, 10),
    };
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SmartMoneyAlertService, SmartMoneyAlert } from '../../../../../web3-smart-money-alert/src/smart-money-alert.service';

@Controller('web3/smart-money-alert')
export class SmartMoneyAlertController {
  constructor(private readonly service: SmartMoneyAlertService) {}

  // Get market overview
  @Get('market-overview')
  async getMarketOverview() {
    return this.service.getMarketOverview();
  }

  // Get popular wallets
  @Get('wallets/popular')
  async getPopularWallets(@Query('limit') limit?: string) {
    return this.service.getPopularWallets(limit ? parseInt(limit) : 20);
  }

  // Search wallets
  @Get('wallets/search')
  async searchWallets(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.service.searchWallets(query, limit ? parseInt(limit) : 10);
  }

  // Get all wallets with filters
  @Get('wallets')
  async getWallets(
    @Query('category') category?: string,
    @Query('chain') chain?: string,
    @Query('minVolume') minVolume?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.service.getWallets({
      category,
      chain,
      minVolume: minVolume ? parseInt(minVolume) : undefined,
      search,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0
    });
  }

  // Get wallet details
  @Get('wallets/:address')
  async getWalletDetails(@Param('address') address: string) {
    return this.service.getWalletDetails(address);
  }

  // Get wallet activity
  @Get('wallets/:address/activity')
  async getWalletActivity(
    @Param('address') address: string,
    @Query('chain') chain?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.service.getWalletActivity(address, {
      chain,
      type,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0
    });
  }

  // Create alert
  @Post('alerts')
  async createAlert(@Body() data: {
    userId: string;
    walletAddress: string;
    chain: string;
    alertType: SmartMoneyAlert['alertType'];
    threshold?: number;
    webhookUrl?: string;
  }) {
    return this.service.createAlert(data);
  }

  // Get user alerts
  @Get('alerts/user/:userId')
  async getAlerts(@Param('userId') userId: string) {
    return this.service.getAlerts(userId);
  }

  // Update alert
  @Put('alerts/:alertId')
  async updateAlert(
    @Param('alertId') alertId: string,
    @Body() data: Partial<SmartMoneyAlert>
  ) {
    return this.service.updateAlert(alertId, data);
  }

  // Delete alert
  @Delete('alerts/:alertId')
  async deleteAlert(@Param('alertId') alertId: string) {
    return { success: await this.service.deleteAlert(alertId) };
  }

  // Get alert triggers
  @Get('alerts/:alertId/triggers')
  async getTriggers(
    @Param('alertId') alertId: string,
    @Query('limit') limit?: string
  ) {
    return this.service.getTriggers(alertId, limit ? parseInt(limit) : 20);
  }
}

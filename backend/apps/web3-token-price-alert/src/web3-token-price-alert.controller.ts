import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Web3TokenPriceAlertService, PriceAlert, PriceAlertNotification, TokenPrice } from './web3-token-price-alert.service';

@Controller('web3-token-price-alert')
export class Web3TokenPriceAlertController {
  constructor(private readonly priceAlertService: Web3TokenPriceAlertService) {}

  // Get all price alerts
  @Get('alerts')
  getAlerts(): PriceAlert[] {
    return this.priceAlertService.getAlerts();
  }

  // Get alert by ID
  @Get('alerts/:id')
  getAlertById(@Param('id') id: string): PriceAlert | undefined {
    return this.priceAlertService.getAlertById(id);
  }

  // Create new price alert
  @Post('alerts')
  createAlert(@Body() alertData: {
    token: string;
    chain: string;
    targetPrice: number;
    condition: 'above' | 'below';
    notifyEmail?: boolean;
    notifyWebhook?: boolean;
    webhookUrl?: string;
    isActive?: boolean;
  }): PriceAlert {
    return this.priceAlertService.createAlert({
      token: alertData.token,
      chain: alertData.chain || 'ethereum',
      targetPrice: alertData.targetPrice,
      condition: alertData.condition,
      notifyEmail: alertData.notifyEmail ?? true,
      notifyWebhook: alertData.notifyWebhook ?? false,
      webhookUrl: alertData.webhookUrl,
      isActive: alertData.isActive ?? true,
    });
  }

  // Update price alert
  @Put('alerts/:id')
  updateAlert(
    @Param('id') id: string,
    @Body() updates: Partial<PriceAlert>
  ): PriceAlert | null {
    return this.priceAlertService.updateAlert(id, updates);
  }

  // Delete price alert
  @Delete('alerts/:id')
  deleteAlert(@Param('id') id: string): { success: boolean } {
    const deleted = this.priceAlertService.deleteAlert(id);
    return { success: deleted };
  }

  // Toggle alert active status
  @Post('alerts/:id/toggle')
  toggleAlert(@Param('id') id: string): PriceAlert | null {
    return this.priceAlertService.toggleAlert(id);
  }

  // Reset triggered alert
  @Post('alerts/:id/reset')
  resetAlert(@Param('id') id: string): PriceAlert | null {
    return this.priceAlertService.resetAlert(id);
  }

  // Get current token price
  @Get('price/:token')
  async getTokenPrice(
    @Param('token') token: string,
    @Query('chain') chain?: string
  ): Promise<TokenPrice> {
    return this.priceAlertService.getTokenPrice(token, chain);
  }

  // Get multiple token prices
  @Post('prices')
  async getMultipleTokenPrices(
    @Body() data: { tokens: string[]; chain?: string }
  ): Promise<TokenPrice[]> {
    return this.priceAlertService.getMultipleTokenPrices(data.tokens, data.chain);
  }

  // Get supported tokens list
  @Get('tokens')
  getSupportedTokens(): Array<{ symbol: string; name: string }> {
    return this.priceAlertService.getSupportedTokens();
  }

  // Get price history
  @Get('history/:token')
  getPriceHistory(
    @Param('token') token: string,
    @Query('days') days?: string
  ): Array<{ timestamp: Date; price: number }> {
    return this.priceAlertService.getPriceHistory(token, days ? parseInt(days) : 7);
  }

  // Get notifications
  @Get('notifications')
  getNotifications(@Query('alertId') alertId?: string): PriceAlertNotification[] {
    return this.priceAlertService.getNotifications(alertId);
  }

  // Mark notification as sent
  @Post('notifications/:id/acknowledge')
  markNotificationSent(@Param('id') id: string): { success: boolean } {
    const marked = this.priceAlertService.markNotificationSent(id);
    return { success: marked };
  }

  // Get statistics
  @Get('stats')
  getStats() {
    return this.priceAlertService.getStats();
  }

  // Manually check prices (for testing)
  @Post('check')
  async checkPrices(): Promise<PriceAlertNotification[]> {
    return this.priceAlertService.checkPrices();
  }
}

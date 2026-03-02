import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Web3WhaleAlertService, WhaleAlert, WhaleTransaction, WhaleAlertNotification } from './web3-whale-alert.service';

@ApiTags('Whale Alert')
@Controller('whale-alert')
export class Web3WhaleAlertController {
  constructor(private readonly whaleAlertService: Web3WhaleAlertService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Get all whale alerts' })
  getAlerts(): WhaleAlert[] {
    return this.whaleAlertService.getAlerts();
  }

  @Get('alerts/:id')
  @ApiOperation({ summary: 'Get whale alert by ID' })
  getAlertById(@Param('id') id: string): WhaleAlert | undefined {
    return this.whaleAlertService.getAlertById(id);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create new whale alert' })
  createAlert(@Body() alert: Omit<WhaleAlert, 'id' | 'createdAt'>): WhaleAlert {
    return this.whaleAlertService.createAlert(alert);
  }

  @Put('alerts/:id')
  @ApiOperation({ summary: 'Update whale alert' })
  updateAlert(
    @Param('id') id: string,
    @Body() updates: Partial<WhaleAlert>
  ): WhaleAlert | null {
    return this.whaleAlertService.updateAlert(id, updates);
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'Delete whale alert' })
  deleteAlert(@Param('id') id: string): { success: boolean } {
    return { success: this.whaleAlertService.deleteAlert(id) };
  }

  @Get('whales')
  @ApiOperation({ summary: 'Get known whale addresses' })
  getKnownWhales(): Array<{ address: string; label: string; category: string }> {
    return this.whaleAlertService.getKnownWhales();
  }

  @Post('whales')
  @ApiOperation({ summary: 'Add custom whale address' })
  addCustomWhale(
    @Body() body: { address: string; label: string; category?: string }
  ): { success: boolean } {
    this.whaleAlertService.addCustomWhale(body.address, body.label, body.category);
    return { success: true };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get whale transactions' })
  @ApiQuery({ name: 'chain', required: false, type: String })
  @ApiQuery({ name: 'minValueUSD', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getWhaleTransactions(
    @Query('chain') chain?: string,
    @Query('minValueUSD') minValueUSD?: number,
    @Query('limit') limit?: number
  ): Promise<WhaleTransaction[]> {
    return this.whaleAlertService.getWhaleTransactions(
      chain,
      minValueUSD || 10000,
      limit || 50
    );
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get whale alert notifications' })
  @ApiQuery({ name: 'alertId', required: false, type: String })
  getNotifications(@Query('alertId') alertId?: string): WhaleAlertNotification[] {
    return this.whaleAlertService.getNotifications(alertId);
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markNotificationRead(@Param('id') id: string): { success: boolean } {
    return { success: this.whaleAlertService.markNotificationSent(id) };
  }

  @Post('check')
  @ApiOperation({ summary: 'Check for whale movements manually' })
  async checkWhaleMovements(): Promise<WhaleAlertNotification[]> {
    return this.whaleAlertService.checkWhaleMovements();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get whale alert statistics' })
  getStats() {
    return this.whaleAlertService.getWhaleStats();
  }
}

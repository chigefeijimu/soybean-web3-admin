import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DefiAlertsService, Alert, AlertConfig, ProtocolMetric } from './defi-alerts.service';

@Controller('web3/defi-alerts')
export class DefiAlertsController {
  constructor(private readonly alertsService: DefiAlertsService) {}

  @Get('alerts')
  async getAlerts(@Query('type') type?: string, @Query('status') status?: string) {
    return this.alertsService.getAlerts(type, status);
  }

  @Get('alerts/:id')
  async getAlertById(@Param('id') id: string) {
    return this.alertsService.getAlertById(id);
  }

  @Post('alerts/config')
  async createAlertConfig(@Body() config: AlertConfig) {
    return this.alertsService.createAlertConfig(config);
  }

  @Get('alerts/configs')
  async getAlertConfigs() {
    return this.alertsService.getAlertConfigs();
  }

  @Post('alerts/configs/:id/disable')
  async disableAlertConfig(@Param('id') id: string) {
    return this.alertsService.disableAlertConfig(id);
  }

  @Get('protocols')
  async getMonitoredProtocols() {
    return this.alertsService.getMonitoredProtocols();
  }

  @Get('protocols/:name/metrics')
  async getProtocolMetrics(@Param('name') name: string) {
    return this.alertsService.getProtocolMetrics(name);
  }

  @Get('metrics')
  async getAllMetrics(@Query('chain') chain?: string) {
    return this.alertsService.getAllMetrics(chain);
  }

  @Get('liquidation-events')
  async getLiquidationEvents(@Query('minAmount') minAmount?: string) {
    const min = minAmount ? parseFloat(minAmount) : 10000;
    return this.alertsService.getLiquidationEvents(min);
  }

  @Get('tvl-changes')
  async getTVLChanges(@Query('threshold') threshold?: string) {
    const thresh = threshold ? parseFloat(threshold) : 10;
    return this.alertsService.getTVLChanges(thresh);
  }

  @Get('yield-anomalies')
  async getYieldAnomalies() {
    return this.alertsService.getYieldAnomalies();
  }

  @Get('dashboard')
  async getDashboard() {
    return this.alertsService.getDashboard();
  }

  @Post('alerts/:id/acknowledge')
  async acknowledgeAlert(@Param('id') id: string) {
    return this.alertsService.acknowledgeAlert(id);
  }

  @Post('alerts/clear')
  async clearOldAlerts(@Body() body: { daysOld: number }) {
    return this.alertsService.clearOldAlerts(body.daysOld);
  }
}

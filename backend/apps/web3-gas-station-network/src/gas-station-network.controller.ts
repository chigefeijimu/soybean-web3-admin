import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { GasStationNetworkService, GasAlert } from './gas-station-network.service';

@ApiTags('gas-station-network')
@Controller('gas-station-network')
export class GasStationNetworkController {
  constructor(private readonly gasStationService: GasStationNetworkService) {}

  @Get('prices')
  @ApiOperation({ summary: 'Get all chain gas prices' })
  async getAllGasPrices() {
    return this.gasStationService.getAllGasPrices();
  }

  @Get('prices/:chain')
  @ApiOperation({ summary: 'Get gas price for specific chain' })
  @ApiParam({ name: 'chain', description: 'Chain name (e.g., Ethereum, Polygon)' })
  async getChainGasPrice(@Param('chain') chain: string) {
    const price = await this.gasStationService.getChainGasPrice(chain);
    if (!price) {
      return { error: `Chain ${chain} not found` };
    }
    return price;
  }

  @Get('recommendation')
  @ApiOperation({ summary: 'Get gas price recommendation for transactions' })
  @ApiQuery({ name: 'txType', required: false, description: 'Transaction type (swap, transfer, etc.)' })
  async getRecommendation(@Query('txType') txType?: string) {
    return this.gasStationService.getRecommendation(txType);
  }

  @Get('estimates')
  @ApiOperation({ summary: 'Get transaction cost estimates' })
  @ApiQuery({ name: 'txType', required: false, description: 'Transaction type' })
  async getTransactionEstimates(@Query('txType') txType?: string) {
    return this.gasStationService.getTransactionEstimates(txType);
  }

  @Get('history/:chain')
  @ApiOperation({ summary: 'Get gas price history for a chain' })
  @ApiParam({ name: 'chain', description: 'Chain name' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (1-30)' })
  async getGasHistory(
    @Param('chain') chain: string,
    @Query('days') days?: string,
  ) {
    return this.gasStationService.getGasHistory(chain, days ? parseInt(days) : 7);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare chains for gas optimization' })
  async compareChains() {
    return this.gasStationService.compareChains();
  }

  @Get('best-time')
  @ApiOperation({ summary: 'Get best time to transact for lowest fees' })
  async getBestTimeToTransact() {
    return this.gasStationService.getBestTimeToTransact();
  }

  @Get('cross-chain/:from/:to')
  @ApiOperation({ summary: 'Analyze cross-chain transaction costs' })
  @ApiParam({ name: 'from', description: 'Source chain' })
  @ApiParam({ name: 'to', description: 'Destination chain' })
  async getCrossChainAnalysis(
    @Param('from') from: string,
    @Param('to') to: string,
  ) {
    return this.gasStationService.getCrossChainAnalysis(from, to);
  }

  @Get('network-status')
  @ApiOperation({ summary: 'Get network status for all chains' })
  async getNetworkStatus() {
    return this.gasStationService.getNetworkStatus();
  }

  @Get('saving-tips')
  @ApiOperation({ summary: 'Get gas saving tips' })
  async getGasSavingTips() {
    return this.gasStationService.getGasSavingTips();
  }

  // Alert management endpoints
  private alerts: GasAlert[] = [];

  @Get('alerts')
  @ApiOperation({ summary: 'Get all gas alerts' })
  async getAlerts() {
    return this.alerts;
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create a gas alert' })
  async createAlert(@Body() alertData: Partial<GasAlert>) {
    const alert: GasAlert = {
      id: `alert_${Date.now()}`,
      chain: alertData.chain || 'Ethereum',
      threshold: alertData.threshold || 50,
      condition: alertData.condition || 'above',
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.alerts.push(alert);
    return alert;
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'Delete a gas alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  async deleteAlert(@Param('id') id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    return { success: true };
  }

  @Post('alerts/:id/toggle')
  @ApiOperation({ summary: 'Toggle alert active status' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  async toggleAlert(@Param('id') id: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.active = !alert.active;
    }
    return alert;
  }
}

import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { LiquidationScannerService, LiquidationOpportunity, PositionHealth, LiquidationAlert } from './liquidation-scanner.service';

@Controller('liquidation-scanner')
export class LiquidationScannerController {
  constructor(private readonly liquidationScannerService: LiquidationScannerService) {}

  @Get('opportunities')
  getOpportunities(
    @Query('chain') chain?: string,
    @Query('protocol') protocol?: string,
    @Query('minCollateral') minCollateral?: string,
    @Query('limit') limit?: string,
  ) {
    return this.liquidationScannerService.getLiquidationOpportunities(
      chain,
      protocol,
      minCollateral ? parseFloat(minCollateral) : undefined,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('opportunities/:address')
  getAddressOpportunities(@Param('address') address: string) {
    return this.liquidationScannerService.getOpportunitiesByAddress(address);
  }

  @Get('positions')
  getPositions(
    @Query('address') address?: string,
    @Query('protocol') protocol?: string,
    @Query('chain') chain?: string,
  ) {
    if (address) {
      return this.liquidationScannerService.getPositionsByAddress(address);
    }
    return this.liquidationScannerService.getAllPositions(protocol, chain);
  }

  @Get('positions/:address')
  getPositionDetail(@Param('address') address: string) {
    return this.liquidationScannerService.getPositionDetails(address);
  }

  @Post('monitor')
  addPositionToMonitor(@Body() body: { address: string; protocol?: string; chain?: string }) {
    return this.liquidationScannerService.addPositionToMonitor(
      body.address,
      body.protocol,
      body.chain || 'ethereum',
    );
  }

  @Delete('monitor/:address')
  removePositionFromMonitor(@Param('address') address: string) {
    return { success: this.liquidationScannerService.removePositionFromMonitor(address) };
  }

  @Get('monitor')
  getMonitoredPositions() {
    return this.liquidationScannerService.getMonitoredPositions();
  }

  @Get('alerts')
  getAlerts(@Query('limit') limit?: string, @Query('address') address?: string) {
    return this.liquidationScannerService.getAlerts(
      limit ? parseInt(limit) : 20,
      address,
    );
  }

  @Get('stats')
  getStats() {
    return this.liquidationScannerService.getLiquidationStats();
  }

  @Get('protocols')
  getSupportedProtocols() {
    return this.liquidationScannerService.getSupportedProtocols();
  }

  @Get('chains')
  getSupportedChains() {
    return this.liquidationScannerService.getSupportedChains();
  }

  @Get('health-distribution')
  getHealthDistribution(@Query('chain') chain?: string) {
    return this.liquidationScannerService.getHealthDistribution(chain);
  }

  @Get('historical')
  getHistoricalLiquidations(
    @Query('chain') chain?: string,
    @Query('days') days?: string,
  ) {
    return this.liquidationScannerService.getHistoricalLiquidations(
      chain,
      days ? parseInt(days) : 7,
    );
  }

  @Get('profit-calculator')
  calculateLiquidationProfit(
    @Query('address') address: string,
    @Query('gasPrice') gasPrice?: string,
  ) {
    return this.liquidationScannerService.calculateLiquidationProfit(
      address,
      gasPrice ? parseFloat(gasPrice) : undefined,
    );
  }
}

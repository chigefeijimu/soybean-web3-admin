import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LiquidationScannerService } from './liquidation-scanner.service';

@ApiTags('Liquidation Scanner')
@Controller('liquidation-scanner')
export class LiquidationScannerController {
  constructor(private readonly liquidationScannerService: LiquidationScannerService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get liquidation scanner statistics' })
  async getStats() {
    return this.liquidationScannerService.getStats();
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Get liquidation opportunities' })
  @ApiQuery({ name: 'chain', required: false, description: 'Filter by chain' })
  @ApiQuery({ name: 'protocol', required: false, description: 'Filter by protocol' })
  @ApiQuery({ name: 'minProfit', required: false, description: 'Minimum profit threshold' })
  async getOpportunities(
    @Query('chain') chain?: string,
    @Query('protocol') protocol?: string,
    @Query('minProfit') minProfit?: string,
  ) {
    return this.liquidationScannerService.getOpportunities(
      chain,
      protocol,
      minProfit ? parseFloat(minProfit) : undefined
    );
  }

  @Get('positions')
  @ApiOperation({ summary: 'Get all monitored positions' })
  async getPositions() {
    return this.liquidationScannerService.getPositions();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get liquidation alerts' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of alerts to return' })
  async getAlerts(@Query('limit') limit?: string) {
    return this.liquidationScannerService.getAlerts(limit ? parseInt(limit) : 20);
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  async getChains() {
    return this.liquidationScannerService.getChains();
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported protocols' })
  async getProtocols() {
    return this.liquidationScannerService.getProtocols();
  }
}

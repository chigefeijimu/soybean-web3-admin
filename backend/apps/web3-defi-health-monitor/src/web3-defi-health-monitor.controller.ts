import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { Web3DefiHealthMonitorService, DeFiPosition, HealthMetrics, PortfolioHealthSummary, PositionAlert } from './web3-defi-health-monitor.service';

@Controller('web3-defi-health-monitor')
export class Web3DefiHealthMonitorController {
  constructor(private readonly service: Web3DefiHealthMonitorService) {}

  // Get positions for an address
  @Get('positions')
  getPositions(@Query('address') address: string): DeFiPosition[] {
    return this.service.getPositions(address);
  }

  // Get position by ID
  @Get('positions/:id')
  getPositionById(@Param('id') id: string): DeFiPosition | undefined {
    return this.service.getPositionById(id);
  }

  // Get positions by chain
  @Get('positions/chain/:chain')
  getPositionsByChain(
    @Query('address') address: string,
    @Param('chain') chain: string,
  ): DeFiPosition[] {
    return this.service.getPositionsByChain(address, chain);
  }

  // Get positions by protocol
  @Get('positions/protocol/:protocol')
  getPositionsByProtocol(
    @Query('address') address: string,
    @Param('protocol') protocol: string,
  ): DeFiPosition[] {
    return this.service.getPositionsByProtocol(address, protocol);
  }

  // Get positions by type
  @Get('positions/type/:type')
  getPositionsByType(
    @Query('address') address: string,
    @Param('type') type: string,
  ): DeFiPosition[] {
    return this.service.getPositionsByType(address, type);
  }

  // Add new position
  @Post('positions')
  @HttpCode(HttpStatus.CREATED)
  addPosition(
    @Body()
    data: {
      address: string;
      chain: string;
      protocol: string;
      type: 'lending' | 'staking' | 'liquidity' | 'yield_farming' | 'bridge';
      token0?: string;
      token1?: string;
      depositAmount: number;
      depositValueUSD: number;
      apy: number;
      rewardToken?: string;
      healthFactor?: number;
    },
  ): DeFiPosition {
    return this.service.addPosition(data);
  }

  // Update position
  @Put('positions/:id')
  updatePosition(
    @Param('id') id: string,
    @Body() updates: Partial<DeFiPosition>,
  ): DeFiPosition | null {
    return this.service.updatePosition(id, updates);
  }

  // Delete position
  @Delete('positions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePosition(@Param('id') id: string): boolean {
    return this.service.deletePosition(id);
  }

  // Calculate health metrics
  @Get('health/metrics')
  getHealthMetrics(@Query('address') address: string): HealthMetrics {
    return this.service.calculateHealthMetrics(address);
  }

  // Get portfolio health summary
  @Get('health/summary')
  getPortfolioHealthSummary(@Query('address') address: string): PortfolioHealthSummary {
    return this.service.getPortfolioHealthSummary(address);
  }

  // Get alerts for position
  @Get('alerts/position/:positionId')
  getPositionAlerts(@Param('positionId') positionId: string): PositionAlert[] {
    return this.service.getPositionAlerts(positionId);
  }

  // Get all alerts for address
  @Get('alerts')
  getAllAlerts(@Query('address') address: string): PositionAlert[] {
    return this.service.getAllAlerts(address);
  }

  // Acknowledge alert
  @Put('alerts/:id/acknowledge')
  acknowledgeAlert(@Param('id') id: string): PositionAlert | null {
    return this.service.acknowledgeAlert(id);
  }

  // Get supported chains
  @Get('config/chains')
  getSupportedChains(): string[] {
    return this.service.getSupportedChains();
  }

  // Get supported protocols
  @Get('config/protocols')
  getSupportedProtocols(): string[] {
    return this.service.getSupportedProtocols();
  }

  // Get global statistics
  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}

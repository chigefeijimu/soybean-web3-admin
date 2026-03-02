import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DefiPositionManagerService } from './defi-position-manager.service';

@ApiTags('DeFi Position Manager')
@Controller('defi-position-manager')
export class DefiPositionManagerController {
  constructor(private readonly defiPositionManagerService: DefiPositionManagerService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get unified DeFi portfolio for a wallet' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'chains', required: false, description: 'Comma-separated chain list' })
  async getPortfolio(
    @Query('address') address: string,
    @Query('chains') chains?: string,
  ) {
    return this.defiPositionManagerService.getPortfolio(address, chains);
  }

  @Get('positions')
  @ApiOperation({ summary: 'Get all DeFi positions for a wallet' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'protocol', required: false, description: 'Filter by protocol' })
  @ApiQuery({ name: 'chain', required: false, description: 'Filter by chain' })
  async getPositions(
    @Query('address') address: string,
    @Query('protocol') protocol?: string,
    @Query('chain') chain?: string,
  ) {
    return this.defiPositionManagerService.getPositions(address, protocol, chain);
  }

  @Get('positions/:protocol')
  @ApiOperation({ summary: 'Get positions for a specific protocol' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getProtocolPositions(
    @Param('protocol') protocol: string,
    @Query('address') address: string,
  ) {
    return this.defiPositionManagerService.getPositions(address, protocol);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get portfolio summary with risk metrics' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getSummary(@Query('address') address: string) {
    return this.defiPositionManagerService.getSummary(address);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get position health analysis' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getHealth(@Query('address') address: string) {
    return this.defiPositionManagerService.getHealth(address);
  }

  @Get('yield')
  @ApiOperation({ summary: 'Get aggregated yield statistics' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period: 7d/30d/90d' })
  async getYield(
    @Query('address') address: string,
    @Query('period') period?: string,
  ) {
    return this.defiPositionManagerService.getYield(address, period);
  }

  @Get('allocation')
  @ApiOperation({ summary: 'Get asset allocation breakdown' })
  @ApiQuery({ name: 'address', required: true, description: 'Wallet address' })
  async getAllocation(@Query('address') address: string) {
    return this.defiPositionManagerService.getAllocation(address);
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported protocols' })
  async getProtocols() {
    return this.defiPositionManagerService.getSupportedProtocols();
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  async getChains() {
    return this.defiPositionManagerService.getSupportedChains();
  }

  @Get('top-pools')
  @ApiOperation({ summary: 'Get popular pools across protocols' })
  @ApiQuery({ name: 'chain', required: false, description: 'Filter by chain' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  async getTopPools(
    @Query('chain') chain?: string,
    @Query('limit') limit?: string,
  ) {
    return this.defiPositionManagerService.getTopPools(chain, limit ? parseInt(limit) : 10);
  }

  @Post('track')
  @ApiOperation({ summary: 'Add address to tracking list' })
  async trackAddress(@Body() body: { address: string; label?: string }) {
    return this.defiPositionManagerService.trackAddress(body.address, body.label);
  }

  @Get('tracked')
  @ApiOperation({ summary: 'Get tracked addresses' })
  async getTrackedAddresses() {
    return this.defiPositionManagerService.getTrackedAddresses();
  }
}

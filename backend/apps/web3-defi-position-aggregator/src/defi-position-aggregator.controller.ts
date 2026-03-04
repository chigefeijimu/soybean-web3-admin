import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DefiPositionAggregatorService, DefiPosition, AggregatedPositions } from './src/defi-position-aggregator.service';

@Controller('defi-position-aggregator')
export class DefiPositionAggregatorController {
  constructor(private readonly defiPositionService: DefiPositionAggregatorService) {}

  @Get('positions/:address')
  async getPositions(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ): Promise<AggregatedPositions> {
    const chainList = chains ? chains.split(',') : undefined;
    return this.defiPositionService.getPositions(address.toLowerCase(), chainList);
  }

  @Get('compare')
  async comparePositions(
    @Query('addresses') addresses: string,
    @Query('chains') chains?: string,
  ): Promise<{
    addresses: string[];
    totalValues: number[];
    comparisons: Array<{
      address: string;
      totalValue: number;
      positionCount: number;
      chains: string[];
      protocols: string[];
    }>;
  }> {
    const addressList = addresses.split(',').map(a => a.toLowerCase());
    const chainList = chains ? chains.split(',') : undefined;
    return this.defiPositionService.comparePositions(addressList, chainList);
  }

  @Get('top-positions')
  async getTopPositions(
    @Query('limit') limit?: string,
    @Query('chain') chain?: string,
  ): Promise<DefiPosition[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.defiPositionService.getTopPositions(limitNum, chain);
  }

  @Post('health')
  async getPositionHealth(
    @Body() body: { positions: DefiPosition[] },
  ): Promise<{
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{ name: string; value: number; weight: number; score: number }>;
    recommendations: string[];
  }> {
    return this.defiPositionService.getPositionHealth(body.positions);
  }

  @Get('supported-chains')
  async getSupportedChains(): Promise<string[]> {
    return this.defiPositionService.getSupportedChains();
  }

  @Get('supported-protocols')
  async getSupportedProtocols(): Promise<Record<string, string[]>> {
    return this.defiPositionService.getSupportedProtocols();
  }

  @Get('health/:address')
  async getAddressHealth(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ): Promise<{
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{ name: string; value: number; weight: number; score: number }>;
    recommendations: string[];
  }> {
    const chainList = chains ? chains.split(',') : undefined;
    const positions = await this.defiPositionService.getPositions(address.toLowerCase(), chainList);
    return this.defiPositionService.getPositionHealth(positions.positions);
  }
}

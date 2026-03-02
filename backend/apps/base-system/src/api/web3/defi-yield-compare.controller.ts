import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DefiYieldCompareService } from './defi-yield-compare.service';

@ApiTags('DeFi Yield Compare')
@Controller('api/web3/defi-yield-compare')
export class DefiYieldCompareController {
  constructor(private readonly defiYieldCompareService: DefiYieldCompareService) {}

  @Get('protocols')
  @ApiOperation({ summary: 'Get all supported DeFi protocols' })
  @ApiResponse({ status: 200, description: 'List of supported protocols' })
  async getProtocols() {
    return this.defiYieldCompareService.getSupportedProtocols();
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get current yield rates across protocols' })
  @ApiQuery({ name: 'chain', required: false, description: 'Filter by chain' })
  @ApiQuery({ name: 'protocol', required: false, description: 'Filter by protocol' })
  @ApiQuery({ name: 'asset', required: false, description: 'Filter by asset (e.g., ETH, USDC)' })
  async getYieldRates(
    @Query('chain') chain?: string,
    @Query('protocol') protocol?: string,
    @Query('asset') asset?: string,
  ) {
    return this.defiYieldCompareService.getYieldRates({ chain, protocol, asset });
  }

  @Get('best-rates')
  @ApiOperation({ summary: 'Get best yield rates for an asset' })
  @ApiQuery({ name: 'asset', required: true, description: 'Asset symbol (e.g., ETH, USDC, USDT)' })
  @ApiQuery({ name: 'amount', required: false, description: 'Amount to calculate potential returns' })
  async getBestRates(
    @Query('asset') asset: string,
    @Query('amount') amount?: string,
  ) {
    return this.defiYieldCompareService.getBestRates(asset, amount);
  }

  @Get('historical')
  @ApiOperation({ summary: 'Get historical yield rates' })
  @ApiQuery({ name: 'protocol', required: false })
  @ApiQuery({ name: 'asset', required: false })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' })
  async getHistoricalRates(
    @Query('protocol') protocol?: string,
    @Query('asset') asset?: string,
    @Query('days') days?: number,
  ) {
    return this.defiYieldCompareService.getHistoricalRates(protocol, asset, days);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare yields between protocols' })
  @ApiQuery({ name: 'protocols', required: true, description: 'Comma-separated protocol names' })
  @ApiQuery({ name: 'asset', required: true, description: 'Asset to compare' })
  @ApiQuery({ name: 'amount', required: false, description: 'Investment amount' })
  async compareProtocols(
    @Query('protocols') protocols: string,
    @Query('asset') asset: string,
    @Query('amount') amount?: string,
  ) {
    const protocolList = protocols.split(',').map(p => p.trim());
    return this.defiYieldCompareService.compareProtocols(protocolList, asset, amount);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending yield opportunities' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 10)' })
  async getTrendingOpportunities(@Query('limit') limit?: number) {
    return this.defiYieldCompareService.getTrendingOpportunities(limit);
  }

  @Get('risk-analysis')
  @ApiOperation({ summary: 'Get risk analysis for protocols' })
  @ApiQuery({ name: 'protocol', required: false })
  async getRiskAnalysis(@Query('protocol') protocol?: string) {
    return this.defiYieldCompareService.getRiskAnalysis(protocol);
  }
}

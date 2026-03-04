import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DefiTvlComparatorService } from './defi-tvl-comparator.service';

@Controller('defi-tvl-comparator')
export class DefiTvlComparatorController {
  constructor(private readonly defiTvlComparatorService: DefiTvlComparatorService) {}

  @Get('comparison')
  async getTVLComparison(
    @Query('chains') chains?: string,
    @Query('categories') categories?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    const chainsArray = chains ? chains.split(',') : undefined;
    const categoriesArray = categories ? categories.split(',') : undefined;
    
    return this.defiTvlComparatorService.getTVLComparison(
      chainsArray,
      categoriesArray,
      timeRange || '30d',
    );
  }

  @Get('protocol/:id')
  async getProtocolDetails(@Param('id') id: string) {
    return this.defiTvlComparatorService.getProtocolDetails(id);
  }

  @Get('trends')
  async getTVLTrends(
    @Query('protocolIds') protocolIds: string,
    @Query('timeRange') timeRange?: string,
  ) {
    const ids = protocolIds ? protocolIds.split(',') : [];
    return this.defiTvlComparatorService.getTVLTrends(ids, timeRange || '30d');
  }

  @Get('gainers')
  async getTopGainers(
    @Query('limit') limit?: number,
    @Query('period') period?: string,
  ) {
    return this.defiTvlComparatorService.getTopGainers(
      limit ? Number(limit) : 10,
      period || '24h',
    );
  }

  @Get('categories')
  async getCategoryBreakdown() {
    return this.defiTvlComparatorService.getCategoryBreakdown();
  }

  @Get('chains')
  getSupportedChains() {
    return this.defiTvlComparatorService.getSupportedChains();
  }

  @Get('categories/list')
  getSupportedCategories() {
    return this.defiTvlComparatorService.getSupportedCategories();
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'DeFi TVL Comparator' };
  }
}

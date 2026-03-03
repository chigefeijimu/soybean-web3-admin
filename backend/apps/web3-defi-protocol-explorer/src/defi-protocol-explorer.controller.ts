import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DefiProtocolExplorerService } from './defi-protocol-explorer.service';

@Controller('defi-protocol-explorer')
export class DefiProtocolExplorerController {
  constructor(private readonly defiProtocolExplorerService: DefiProtocolExplorerService) {}

  @Get('protocols')
  async getProtocols(
    @Query('category') category?: string,
    @Query('chain') chain?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.defiProtocolExplorerService.getProtocols({
      category,
      chain,
      sort: sort as any,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('protocols/:id')
  async getProtocolDetails(@Param('id') id: string) {
    return this.defiProtocolExplorerService.getProtocolDetails(id);
  }

  @Get('protocols/:id/tvl')
  async getProtocolTvl(
    @Param('id') id: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.defiProtocolExplorerService.getProtocolTvl(id, timeRange);
  }

  @Get('protocols/:id/metrics')
  async getProtocolMetrics(@Param('id') id: string) {
    return this.defiProtocolExplorerService.getProtocolMetrics(id);
  }

  @Get('protocols/:id/competitors')
  async getCompetitors(@Param('id') id: string) {
    return this.defiProtocolExplorerService.getCompetitors(id);
  }

  @Get('protocols/:id/historical-metrics')
  async getHistoricalMetrics(
    @Param('id') id: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.defiProtocolExplorerService.getHistoricalMetrics(id, timeRange);
  }

  @Get('categories')
  async getCategories() {
    return this.defiProtocolExplorerService.getCategories();
  }

  @Get('chains')
  async getSupportedChains() {
    return this.defiProtocolExplorerService.getSupportedChains();
  }

  @Get('search')
  async searchProtocols(@Query('q') query: string) {
    return this.defiProtocolExplorerService.searchProtocols(query);
  }

  @Get('trending')
  async getTrendingProtocols(@Query('limit') limit?: string) {
    return this.defiProtocolExplorerService.getTrendingProtocols(limit ? parseInt(limit) : 10);
  }

  @Get('featured')
  async getFeaturedProtocols() {
    return this.defiProtocolExplorerService.getFeaturedProtocols();
  }

  @Get('new')
  async getNewProtocols(@Query('days') days?: string, @Query('limit') limit?: string) {
    return this.defiProtocolExplorerService.getNewProtocols(
      days ? parseInt(days) : 30,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('compare')
  async compareProtocols(@Query('ids') ids: string) {
    const protocolIds = ids.split(',');
    return this.defiProtocolExplorerService.compareProtocols(protocolIds);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.defiProtocolExplorerService.getDashboard();
  }

  @Get('top-gainers')
  async getTopGainers(@Query('timeRange') timeRange?: string, @Query('limit') limit?: string) {
    return this.defiProtocolExplorerService.getTopGainers(timeRange, limit ? parseInt(limit) : 10);
  }

  @Get('top-losers')
  async getTopLosers(@Query('timeRange') timeRange?: string, @Query('limit') limit?: string) {
    return this.defiProtocolExplorerService.getTopLosers(timeRange, limit ? parseInt(limit) : 10);
  }
}

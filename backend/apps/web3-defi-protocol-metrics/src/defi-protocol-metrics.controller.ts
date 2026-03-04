import { Controller, Get, Query, Param } from '@nestjs/common';
import { DefiProtocolMetricsService } from './defi-protocol-metrics.service';

@Controller('defi-protocol-metrics')
export class DefiProtocolMetricsController {
  constructor(private readonly service: DefiProtocolMetricsService) {}

  @Get('overview')
  getOverview(@Query('chains') chains?: string) {
    return this.service.getOverview(chains);
  }

  @Get('protocols')
  getProtocols(
    @Query('chain') chain?: string,
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getProtocols(chain, category, sortBy, limit);
  }

  @Get('protocol/:id')
  getProtocolDetails(@Param('id') id: string) {
    return this.service.getProtocolDetails(id);
  }

  @Get('compare')
  compareProtocols(@Query('protocols') protocols: string) {
    return this.service.compareProtocols(protocols);
  }

  @Get('trending')
  getTrending(@Query('timeRange') timeRange?: string) {
    return this.service.getTrending(timeRange);
  }

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  @Get('chains')
  getChains() {
    return this.service.getChains();
  }

  @Get('search')
  searchProtocols(@Query('q') query: string) {
    return this.service.searchProtocols(query);
  }
}

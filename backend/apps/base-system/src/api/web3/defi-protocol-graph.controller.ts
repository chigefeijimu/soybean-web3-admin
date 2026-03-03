import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DefiProtocolGraphService } from './defi-protocol-graph.service';

@Controller('web3/defi-protocol-graph')
export class DefiProtocolGraphController {
  constructor(private readonly defiProtocolGraphService: DefiProtocolGraphService) {}

  @Get('overview')
  async getOverview() {
    return this.defiProtocolGraphService.getProtocolGraphOverview();
  }

  @Get('protocols')
  async getProtocols(
    @Query('chain') chain?: string,
    @Query('category') category?: string,
  ) {
    return this.defiProtocolGraphService.getProtocols(chain, category);
  }

  @Get('protocol/:protocolId')
  async getProtocolDetails(@Param('protocolId') protocolId: string) {
    return this.defiProtocolGraphService.getProtocolDetails(protocolId);
  }

  @Get('interactions')
  async getInteractions(
    @Query('protocolId') protocolId?: string,
    @Query('chain') chain?: string,
  ) {
    return this.defiProtocolGraphService.getProtocolInteractions(protocolId, chain);
  }

  @Get('flow/:fromProtocol/:toProtocol')
  async getFlowBetweenProtocols(
    @Param('fromProtocol') fromProtocol: string,
    @Param('toProtocol') toProtocol: string,
  ) {
    return this.defiProtocolGraphService.getFlowBetweenProtocols(fromProtocol, toProtocol);
  }

  @Get('risk-propagation/:protocolId')
  async getRiskPropagation(@Param('protocolId') protocolId: string) {
    return this.defiProtocolGraphService.analyzeRiskPropagation(protocolId);
  }

  @Get('cluster')
  async getProtocolClusters(@Query('chain') chain?: string) {
    return this.defiProtocolGraphService.identifyProtocolClusters(chain);
  }

  @Get('centrality')
  async getProtocolCentrality(@Query('chain') chain?: string) {
    return this.defiProtocolGraphService.calculateProtocolCentrality(chain);
  }

  @Get('similar/:protocolId')
  async getSimilarProtocols(
    @Param('protocolId') protocolId: string,
    @Query('limit') limit?: number,
  ) {
    return this.defiProtocolGraphService.findSimilarProtocols(protocolId, limit || 5);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.defiProtocolGraphService.getDashboard();
  }

  @Get('historical')
  async getHistoricalData(
    @Query('period') period?: string,
  ) {
    return this.defiProtocolGraphService.getHistoricalData(period || '30d');
  }
}

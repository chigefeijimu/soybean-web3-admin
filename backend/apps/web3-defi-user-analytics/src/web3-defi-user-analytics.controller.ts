import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  Web3DefiUserAnalyticsService,
  ProtocolUserMetrics,
  UserAnalyticsOverview,
} from './web3-defi-user-analytics.service';

@ApiTags('DeFi User Analytics')
@Controller('web3-defi-user-analytics')
export class Web3DefiUserAnalyticsController {
  constructor(private readonly service: Web3DefiUserAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get DeFi user analytics overview across all protocols' })
  async getOverview(): Promise<UserAnalyticsOverview> {
    return this.service.getUserAnalyticsOverview();
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get user metrics for all supported protocols' })
  @ApiQuery({ name: 'chain', required: false, description: 'Filter by chain (ethereum/polygon/arbitrum/optimism/bsc/base/avalanche)' })
  async getAllProtocols(
    @Query('chain') chain?: string,
  ): Promise<ProtocolUserMetrics[]> {
    return this.service.getAllProtocolsUserMetrics(chain);
  }

  @Get('protocol/:protocolId')
  @ApiOperation({ summary: 'Get user metrics for a specific protocol' })
  @ApiParam({ name: 'protocolId', description: 'Protocol identifier (e.g., uniswap, aave, curve)' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain filter' })
  async getProtocolMetrics(
    @Param('protocolId') protocolId: string,
    @Query('chain') chain?: string,
  ): Promise<ProtocolUserMetrics> {
    const metrics = await this.service.getProtocolUserMetrics(protocolId, chain);
    if (!metrics) {
      throw new HttpException(
        `Protocol '${protocolId}' not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return metrics;
  }

  @Get('chain/:chain')
  @ApiOperation({ summary: 'Get user metrics for protocols on a specific chain' })
  @ApiParam({ name: 'chain', description: 'Chain name (ethereum/polygon/arbitrum/optimism/bsc/base/avalanche)' })
  async getChainMetrics(@Param('chain') chain: string): Promise<ProtocolUserMetrics[]> {
    return this.service.getChainUserMetrics(chain);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare user metrics across multiple protocols' })
  @ApiQuery({ name: 'protocols', required: true, description: 'Comma-separated protocol IDs' })
  async compareProtocols(
    @Query('protocols') protocols: string,
  ): Promise<ProtocolUserMetrics[]> {
    const protocolIds = protocols.split(',').map((p) => p.trim());
    return this.service.compareProtocols(protocolIds);
  }

  @Get('retention/:protocolId')
  @ApiOperation({ summary: 'Get user retention analysis for a protocol' })
  @ApiParam({ name: 'protocolId', description: 'Protocol identifier' })
  async getRetentionAnalysis(@Param('protocolId') protocolId: string) {
    const analysis = await this.service.getUserRetentionAnalysis(protocolId);
    if (!analysis) {
      throw new HttpException(
        `Protocol '${protocolId}' not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return analysis;
  }

  @Get('activity/:protocolId')
  @ApiOperation({ summary: 'Get user activity distribution for a protocol' })
  @ApiParam({ name: 'protocolId', description: 'Protocol identifier' })
  async getActivityDistribution(@Param('protocolId') protocolId: string) {
    const distribution = await this.service.getUserActivityDistribution(protocolId);
    if (!distribution) {
      throw new HttpException(
        `Protocol '${protocolId}' not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return distribution;
  }

  @Get('protocols/list')
  @ApiOperation({ summary: 'Get list of supported protocols' })
  getSupportedProtocols() {
    return this.service.getSupportedProtocols();
  }

  @Get('chains/list')
  @ApiOperation({ summary: 'Get list of supported chains' })
  getSupportedChains() {
    return this.service.getSupportedChains();
  }
}

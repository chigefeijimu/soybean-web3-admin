import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CrossChainProtocolAnalyticsService } from './cross-chain-protocol-analytics.service';

class ProtocolQueryDto {
  @ApiQuery({ required: false, description: 'Chain filter (e.g., ethereum, arbitrum)' })
  chain?: string;

  @ApiQuery({ required: false, description: 'Protocol category (dex, lending, staking, yield)' })
  category?: string;

  @ApiQuery({ required: false, description: 'Sort by (tvl, volume, users, apy)' })
  sortBy?: string;

  @ApiQuery({ required: false, description: 'Limit number of results' })
  limit?: number;
}

class CompareProtocolsDto {
  @ApiBody({ schema: { type: 'array', items: { type: 'string' } } })
  @ApiOperation({ description: 'List of protocol identifiers to compare' })
  protocols: string[];
}

class ProtocolMetricsDto {
  @ApiQuery({ required: true, description: 'Protocol identifier' })
  protocolId: string;

  @ApiQuery({ required: false, description: 'Time range (7d, 30d, 90d, 1y)' })
  timeRange?: string;
}

@ApiTags('Cross-chain Protocol Analytics')
@Controller('analytics/protocols')
export class CrossChainProtocolAnalyticsController {
  constructor(
    private readonly analyticsService: CrossChainProtocolAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get cross-chain protocol analytics overview',
    description:
      'Returns aggregated analytics across all supported DeFi protocols on multiple chains',
  })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('list')
  @ApiOperation({
    summary: 'Get list of protocols with analytics',
    description: 'Returns paginated list of DeFi protocols with their analytics data',
  })
  async getProtocolList(@Query() query: ProtocolQueryDto) {
    return this.analyticsService.getProtocolList(query);
  }

  @Get(':protocolId')
  @ApiOperation({
    summary: 'Get detailed analytics for a specific protocol',
    description: 'Returns comprehensive analytics data for a single protocol',
  })
  async getProtocolDetails(
    @Query('protocolId') protocolId: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.analyticsService.getProtocolDetails(protocolId, timeRange);
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare multiple protocols',
    description: 'Side-by-side comparison of multiple DeFi protocols',
  })
  async compareProtocols(@Body() dto: CompareProtocolsDto) {
    return this.analyticsService.compareProtocols(dto.protocols);
  }

  @Get('trending/protocols')
  @ApiOperation({
    summary: 'Get trending protocols',
    description: 'Returns protocols with highest growth in TVL, volume, or users',
  })
  async getTrendingProtocols(@Query('metric') metric?: string) {
    return this.analyticsService.getTrendingProtocols(metric);
  }

  @Get('categories/summary')
  @ApiOperation({
    summary: 'Get category-wise summary',
    description: 'Returns aggregated analytics by protocol category',
  })
  async getCategorySummary() {
    return this.analyticsService.getCategorySummary();
  }

  @Get('chains/analysis')
  @ApiOperation({
    summary: 'Get chain-wise protocol analysis',
    description: 'Returns protocol distribution and performance by chain',
  })
  async getChainAnalysis() {
    return this.analyticsService.getChainAnalysis();
  }

  @Get('metrics/performance')
  @ApiOperation({
    summary: 'Get protocol performance metrics',
    description: 'Returns detailed performance metrics for all protocols',
  })
  async getPerformanceMetrics(@Query('timeRange') timeRange?: string) {
    return this.analyticsService.getPerformanceMetrics(timeRange);
  }

  @Get('risk/assessment')
  @ApiOperation({
    summary: 'Get risk assessment for protocols',
    description: 'Returns risk metrics and scores for all protocols',
  })
  async getRiskAssessment() {
    return this.analyticsService.getRiskAssessment();
  }

  @Get('opportunities/yield')
  @ApiOperation({
    summary: 'Find yield opportunities',
    description: 'Identifies best yield opportunities across protocols',
  })
  async findYieldOpportunities() {
    return this.analyticsService.findYieldOpportunities();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search protocols',
    description: 'Search protocols by name or category',
  })
  async searchProtocols(@Query('q') query: string) {
    return this.analyticsService.searchProtocols(query);
  }

  @Get('leaderboard/tvl')
  @ApiOperation({
    summary: 'Get TVL leaderboard',
    description: 'Returns protocols ranked by Total Value Locked',
  })
  async getTvlLeaderboard(@Query('limit') limit?: number) {
    return this.analyticsService.getLeaderboard('tvl', limit);
  }

  @Get('leaderboard/volume')
  @ApiOperation({
    summary: 'Get volume leaderboard',
    description: 'Returns protocols ranked by trading volume',
  })
  async getVolumeLeaderboard(@Query('limit') limit?: number) {
    return this.analyticsService.getLeaderboard('volume', limit);
  }

  @Get('leaderboard/users')
  @ApiOperation({
    summary: 'Get users leaderboard',
    description: 'Returns protocols ranked by number of users',
  })
  async getUsersLeaderboard(@Query('limit') limit?: number) {
    return this.analyticsService.getLeaderboard('users', limit);
  }

  @Get('leaderboard/growth')
  @ApiOperation({
    summary: 'Get growth leaderboard',
    description: 'Returns protocols ranked by growth rate',
  })
  async getGrowthLeaderboard(@Query('limit') limit?: number) {
    return this.analyticsService.getLeaderboard('growth', limit);
  }

  @Get('health/score')
  @ApiOperation({
    summary: 'Get protocol health scores',
    description: 'Returns health scores for all protocols',
  })
  async getHealthScores() {
    return this.analyticsService.getHealthScores();
  }

  @Get('historical/trends')
  @ApiOperation({
    summary: 'Get historical trends',
    description: 'Returns historical trend data for all protocols',
  })
  async getHistoricalTrends(
    @Query('protocolId') protocolId?: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.analyticsService.getHistoricalTrends(protocolId, timeRange);
  }
}

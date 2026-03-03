import { Controller, Get, Post, Body, Param, Query, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Web3CrossChainBridgeAnalyticsService } from './web3-cross-chain-bridge-analytics.service';
import { ApiResponse } from '../../api/api-response';

@ApiTags('跨链代币桥接分析器')
@Controller('web3/cross-chain-bridge-analytics')
export class Web3CrossChainBridgeAnalyticsController {
  constructor(
    private readonly service: Web3CrossChainBridgeAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: '获取跨链桥接概览' })
  @ApiQuery({ name: 'chainId', required: false })
  async getOverview(@Query('chainId') chainId?: string) {
    const data = await this.service.getOverview(chainId);
    return ApiResponse.success(data);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取桥接统计数据' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['24h', '7d', '30d', '90d'] })
  @ApiQuery({ name: 'chainId', required: false })
  async getStats(
    @Query('timeRange') timeRange: string = '7d',
    @Query('chainId') chainId?: string,
  ) {
    const data = await this.service.getStats(timeRange, chainId);
    return ApiResponse.success(data);
  }

  @Get('bridge/:bridgeName')
  @ApiOperation({ summary: '获取特定桥接的详细信息' })
  @ApiQuery({ name: 'timeRange', required: false })
  async getBridgeDetails(
    @Param('bridgeName') bridgeName: string,
    @Query('timeRange') timeRange: string = '7d',
  ) {
    const data = await this.service.getBridgeDetails(bridgeName, timeRange);
    return ApiResponse.success(data);
  }

  @Get('routes/popular')
  @ApiOperation({ summary: '获取热门桥接路线' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'timeRange', required: false })
  async getPopularRoutes(
    @Query('limit') limit: number = 10,
    @Query('timeRange') timeRange: string = '7d',
  ) {
    const data = await this.service.getPopularRoutes(limit, timeRange);
    return ApiResponse.success(data);
  }

  @Get('tokens/popular')
  @ApiOperation({ summary: '获取热门桥接代币' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'timeRange', required: false })
  async getPopularTokens(
    @Query('limit') limit: number = 20,
    @Query('timeRange') timeRange: string = '7d',
  ) {
    const data = await this.service.getPopularTokens(limit, timeRange);
    return ApiResponse.success(data);
  }

  @Get('trends')
  @ApiOperation({ summary: '获取桥接趋势数据' })
  @ApiQuery({ name: 'timeRange', required: false })
  @ApiQuery({ name: 'interval', required: false, enum: ['1h', '24h', '7d'] })
  async getTrends(
    @Query('timeRange') timeRange: string = '30d',
    @Query('interval') interval: string = '24h',
  ) {
    const data = await this.service.getTrends(timeRange, interval);
    return ApiResponse.success(data);
  }

  @Get('chains/volume')
  @ApiOperation({ summary: '获取各链桥接量分布' })
  @ApiQuery({ name: 'timeRange', required: false })
  async getChainVolumeDistribution(@Query('timeRange') timeRange: string = '7d') {
    const data = await this.service.getChainVolumeDistribution(timeRange);
    return ApiResponse.success(data);
  }

  @Get('compare')
  @ApiOperation({ summary: '对比多个桥接的表现' })
  @ApiQuery({ name: 'bridges', required: false, description: 'Comma-separated bridge names' })
  @ApiQuery({ name: 'timeRange', required: false })
  async compareBridges(
    @Query('bridges') bridges: string = 'LayerZero,Stargate,Across',
    @Query('timeRange') timeRange: string = '7d',
  ) {
    const bridgeList = bridges.split(',').map(b => b.trim());
    const data = await this.service.compareBridges(bridgeList, timeRange);
    return ApiResponse.success(data);
  }

  @Get('efficiency')
  @ApiOperation({ summary: '获取桥接效率分析' })
  @ApiQuery({ name: 'bridgeName', required: false })
  @ApiQuery({ name: 'timeRange', required: false })
  async getEfficiency(
    @Query('bridgeName') bridgeName?: string,
    @Query('timeRange') timeRange: string = '7d',
  ) {
    const data = await this.service.getEfficiency(bridgeName, timeRange);
    return ApiResponse.success(data);
  }

  @Get('alerts')
  @ApiOperation({ summary: '获取桥接异常警报' })
  @ApiQuery({ name: 'severity', required: false, enum: ['info', 'warning', 'critical'] })
  async getAlerts(@Query('severity') severity?: string) {
    const data = await this.service.getAlerts(severity);
    return ApiResponse.success(data);
  }

  @Post('alerts')
  @ApiOperation({ summary: '创建桥接监控警报' })
  async createAlert(@Body() alertDto: any) {
    const data = await this.service.createAlert(alertDto);
    return ApiResponse.success(data);
  }
}

import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FundFlowAnalyzerService } from './fund-flow-analyzer.service';

@ApiTags('Web3 - Fund Flow Analyzer')
@Controller('web3/fund-flow')
export class FundFlowAnalyzerController {
  constructor(private readonly fundFlowAnalyzerService: FundFlowAnalyzerService) {}

  @Get('track-address')
  @ApiOperation({ summary: '追踪地址资金流' })
  async trackAddress(
    @Query('address') address: string,
    @Query('chainId') chainId?: number,
  ) {
    return this.fundFlowAnalyzerService.trackAddress(address, chainId || 1);
  }

  @Get('flow-history')
  @ApiOperation({ summary: '获取资金流历史' })
  async getFlowHistory(
    @Query('address') address: string,
    @Query('chainId') chainId?: number,
    @Query('days') days?: number,
  ) {
    return this.fundFlowAnalyzerService.getFlowHistory(address, chainId || 1, days || 7);
  }

  @Get('top-receivers')
  @ApiOperation({ summary: '获取近期最大资金接收者' })
  async getTopReceivers(
    @Query('chainId') chainId?: number,
    @Query('limit') limit?: number,
  ) {
    return this.fundFlowAnalyzerService.getTopReceivers(chainId || 1, limit || 10);
  }

  @Get('top-senders')
  @ApiOperation({ summary: '获取近期最大资金发送者' })
  async getTopSenders(
    @Query('chainId') chainId?: number,
    @Query('limit') limit?: number,
  ) {
    return this.fundFlowAnalyzerService.getTopSenders(chainId || 1, limit || 10);
  }

  @Get('compare-addresses')
  @ApiOperation({ summary: '对比多个地址的资金流' })
  async compareAddresses(
    @Query('addresses') addresses: string,
    @Query('chainId') chainId?: number,
  ) {
    const addrList = addresses.split(',');
    return this.fundFlowAnalyzerService.compareAddresses(addrList, chainId || 1);
  }

  @Post('set-alert')
  @ApiOperation({ summary: '设置资金流告警' })
  async setAlert(@Body() alertDto: {
    address: string;
    chainId: number;
    threshold: number;
    direction: 'in' | 'out' | 'both';
    notifyEmail?: boolean;
    notifyTelegram?: boolean;
  }) {
    return this.fundFlowAnalyzerService.setAlert(alertDto);
  }

  @Get('alerts')
  @ApiOperation({ summary: '获取用户的资金流告警' })
  async getAlerts(@Query('address') address: string) {
    return this.fundFlowAnalyzerService.getAlerts(address);
  }

  @Get('anomaly-detection')
  @ApiOperation({ summary: '检测资金流异常' })
  async detectAnomalies(
    @Query('address') address: string,
    @Query('chainId') chainId?: number,
  ) {
    return this.fundFlowAnalyzerService.detectAnomalies(address, chainId || 1);
  }

  @Get('flow-pattern')
  @ApiOperation({ summary: '分析资金流模式' })
  async analyzeFlowPattern(
    @Query('address') address: string,
    @Query('chainId') chainId?: number,
  ) {
    return this.fundFlowAnalyzerService.analyzeFlowPattern(address, chainId || 1);
  }
}

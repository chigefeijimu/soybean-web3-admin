import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Web3DefiRiskRadarService } from './web3-defi-risk-radar.service';

@ApiTags('DeFi Risk Radar')
@Controller('api/web3/defi-risk-radar')
export class Web3DefiRiskRadarController {
  constructor(private readonly riskRadarService: Web3DefiRiskRadarService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取风险仪表盘概览' })
  async getDashboard() {
    return this.riskRadarService.getRiskDashboard();
  }

  @Get('rankings')
  @ApiOperation({ summary: '获取协议风险排行榜' })
  @ApiQuery({ name: 'chain', required: false, description: '区块链名称' })
  @ApiQuery({ name: 'sortBy', required: false, description: '排序方式: risk/tvl/tvl_change' })
  async getRankings(
    @Query('chain') chain?: string,
    @Query('sortBy') sortBy: string = 'risk',
  ) {
    return this.riskRadarService.getRiskRankings(chain, sortBy);
  }

  @Get('protocol/:name')
  @ApiOperation({ summary: '分析单个协议风险' })
  @ApiParam({ name: 'name', description: '协议名称' })
  @ApiQuery({ name: 'chain', required: false, description: '区块链名称' })
  async analyzeProtocol(
    @Param('name') name: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.riskRadarService.analyzeProtocolRisk(name, chain);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量分析多个协议风险' })
  @HttpCode(HttpStatus.OK)
  async batchAnalyze(@Body() protocols: { name: string; chain: string }[]) {
    return this.riskRadarService.batchAnalyzeRisk(protocols);
  }

  @Get('alerts')
  @ApiOperation({ summary: '获取风险警报' })
  @ApiQuery({ name: 'threshold', required: false, description: '风险阈值 (0-100)' })
  async getAlerts(@Query('threshold') threshold: number = 50) {
    return this.riskRadarService.getRiskAlerts(threshold);
  }

  @Post('monitor')
  @ApiOperation({ summary: '实时风险监控' })
  @HttpCode(HttpStatus.OK)
  async monitorRisks(
    @Body() body: { protocols: string[]; chain?: string },
  ) {
    return this.riskRadarService.monitorRisks(
      body.protocols,
      body.chain || 'ethereum',
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'API健康检查' })
  async health() {
    return {
      status: 'ok',
      service: 'DeFi Risk Radar',
      timestamp: Date.now(),
    };
  }
}

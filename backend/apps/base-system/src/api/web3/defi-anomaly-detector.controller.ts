import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DefiAnomalyDetectorService } from './defi-anomaly-detector.service';

@ApiTags('DeFi Protocol Anomaly Detector')
@Controller('defi-anomaly-detector')
export class DefiAnomalyDetectorController {
  constructor(private readonly service: DefiAnomalyDetectorService) {}

  @Get('health-status')
  @ApiOperation({ summary: 'Get overall DeFi protocol health status' })
  async getHealthStatus() {
    return this.service.getOverallHealthStatus();
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get all monitored protocols with health scores' })
  async getProtocols() {
    return this.service.getMonitoredProtocols();
  }

  @Get('protocol/:id')
  @ApiOperation({ summary: 'Get specific protocol anomaly status' })
  async getProtocolStatus(@Param('id') id: string) {
    return this.service.getProtocolStatus(id);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Get recent anomalies across all protocols' })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'protocol', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAnomalies(
    @Query('severity') severity?: string,
    @Query('protocol') protocol?: string,
    @Query('limit') limit?: number,
  ) {
    return this.service.getAnomalies(severity, protocol, limit || 50);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get active alerts for user' })
  async getAlerts() {
    return this.service.getActiveAlerts();
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create an anomaly alert' })
  async createAlert(@Body() body: { protocolId: string; condition: string; threshold: number }) {
    return this.service.createAlert(body.protocolId, body.condition, body.threshold);
  }

  @Get('metrics/:protocolId')
  @ApiOperation({ summary: 'Get real-time metrics for a protocol' })
  async getProtocolMetrics(@Param('protocolId') protocolId: string) {
    return this.service.getProtocolMetrics(protocolId);
  }

  @Get('trends/:protocolId')
  @ApiOperation({ summary: 'Get metric trends for a protocol' })
  @ApiQuery({ name: 'timeRange', required: false })
  async getProtocolTrends(
    @Param('protocolId') protocolId: string,
    @Query('timeRange') timeRange: string = '24h',
  ) {
    return this.service.getProtocolTrends(protocolId, timeRange);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get anomaly detector dashboard data' })
  async getDashboard() {
    return this.service.getDashboard();
  }
}

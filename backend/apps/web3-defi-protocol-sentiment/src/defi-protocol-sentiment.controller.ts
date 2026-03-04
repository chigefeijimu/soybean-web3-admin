import { Controller, Get, Query } from '@nestjs/common';
import { DefiProtocolSentimentService } from './defi-protocol-sentiment.service';

@Controller('defi-protocol-sentiment')
export class DefiProtocolSentimentController {
  constructor(private readonly service: DefiProtocolSentimentService) {}

  @Get('overview')
  getOverview() {
    return this.service.getOverview();
  }

  @Get('protocol')
  getProtocolSentiment(
    @Query('protocol') protocol: string,
    @Query('chain') chain?: string,
  ) {
    return this.service.getProtocolSentiment(protocol, chain);
  }

  @Get('trending')
  getTrendingProtocols(@Query('timeframe') timeframe?: string) {
    return this.service.getTrendingProtocols(timeframe);
  }

  @Get('compare')
  compareProtocols(@Query('protocols') protocols: string) {
    const protocolList = protocols.split(',');
    return this.service.compareProtocols(protocolList);
  }

  @Get('history')
  getSentimentHistory(
    @Query('protocol') protocol: string,
    @Query('days') days?: number,
  ) {
    return this.service.getSentimentHistory(protocol, days || 30);
  }

  @Get('alerts')
  getSentimentAlerts(@Query('protocol') protocol?: string) {
    return this.service.getSentimentAlerts(protocol);
  }

  @Get('social-stats')
  getSocialStats(@Query('protocol') protocol: string) {
    return this.service.getSocialStats(protocol);
  }

  @Get('news')
  getProtocolNews(@Query('protocol') protocol: string) {
    return this.service.getProtocolNews(protocol);
  }
}

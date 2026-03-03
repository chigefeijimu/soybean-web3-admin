import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TokenHealthScoreService, TokenHealthQueryDto, TokenHealthBatchQueryDto, TokenHealthComparisonDto, TokenHealthScoreDto, TokenHealthTrendsDto, HealthScoreSummaryDto } from './token-health-score.service';

@ApiTags('Token Health Score')
@Controller()
export class TokenHealthScoreController {
  constructor(private readonly tokenHealthService: TokenHealthScoreService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get single token health score' })
  @ApiResponse({ status: 200, description: 'Token health score', type: TokenHealthScoreDto })
  getTokenHealth(@Query() query: TokenHealthQueryDto) {
    return this.tokenHealthService.getTokenHealth(query);
  }

  @Get('batch')
  @ApiOperation({ summary: 'Get batch token health scores' })
  @ApiResponse({ status: 200, description: 'Batch token health scores', type: [TokenHealthScoreDto] })
  getBatchTokenHealth(@Query() query: TokenHealthBatchQueryDto) {
    return this.tokenHealthService.getBatchTokenHealth(query);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare two tokens health scores' })
  @ApiResponse({ status: 200, description: 'Token comparison result' })
  compareTokens(@Query() query: TokenHealthComparisonDto) {
    return this.tokenHealthService.compareTokens(query);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get token health score trends over time' })
  @ApiQuery({ name: 'symbol', required: true, description: 'Token symbol' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name' })
  @ApiResponse({ status: 200, description: 'Health score trends', type: TokenHealthTrendsDto })
  getTokenTrends(@Query('symbol') symbol: string, @Query('chain') chain?: string) {
    return this.tokenHealthService.getTokenHealthTrends(symbol, chain);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get overall health score summary' })
  @ApiResponse({ status: 200, description: 'Health summary', type: HealthScoreSummaryDto })
  getHealthSummary() {
    return this.tokenHealthService.getHealthSummary();
  }
}

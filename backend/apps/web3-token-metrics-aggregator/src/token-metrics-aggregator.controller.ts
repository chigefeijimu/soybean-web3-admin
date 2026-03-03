import { Controller, Get, Post, Query, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { TokenMetricsAggregatorService, TokenMetricsQueryDto, TokenSearchDto, TokenComparisonDto } from './token-metrics-aggregator.service';

@ApiTags('Token Metrics Aggregator')
@Controller('web3/token-metrics')
export class TokenMetricsAggregatorController {
  constructor(private readonly tokenMetricsService: TokenMetricsAggregatorService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get cross-chain token metrics' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Token symbol (e.g., ETH, BTC)' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Time range: 24h, 7d, 30d, 90d' })
  async getTokenMetrics(
    @Query() query: TokenMetricsQueryDto,
  ) {
    return this.tokenMetricsService.getTokenMetrics(query);
  }

  @Get('cross-chain/:symbol')
  @ApiOperation({ summary: 'Get cross-chain metrics for a token' })
  @ApiParam({ name: 'symbol', description: 'Token symbol' })
  async getCrossChainMetrics(
    @Param('symbol') symbol: string,
  ) {
    return this.tokenMetricsService.getCrossChainMetrics(symbol);
  }

  @Get('arbitrage/:symbol')
  @ApiOperation({ summary: 'Find arbitrage opportunities for a token' })
  @ApiParam({ name: 'symbol', description: 'Token symbol' })
  async findArbitrage(
    @Param('symbol') symbol: string,
  ) {
    return this.tokenMetricsService.findArbitrageOpportunities(symbol);
  }

  @Get('health/:symbol')
  @ApiOperation({ summary: 'Calculate token health score' })
  @ApiParam({ name: 'symbol', description: 'Token symbol' })
  async getHealthScore(
    @Param('symbol') symbol: string,
  ) {
    const crossChainMetrics = await this.tokenMetricsService.getCrossChainMetrics(symbol);
    return this.tokenMetricsService.calculateTokenHealth(symbol, crossChainMetrics);
  }

  @Get('market-overview')
  @ApiOperation({ summary: 'Get market overview with top gainers/losers' })
  async getMarketOverview() {
    return this.tokenMetricsService.getMarketOverview();
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search tokens across chains' })
  @ApiBody({ type: TokenSearchDto })
  async searchTokens(
    @Body() searchDto: TokenSearchDto,
  ) {
    return this.tokenMetricsService.searchTokens(searchDto.query, searchDto.limit);
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare multiple tokens' })
  @ApiBody({ type: TokenComparisonDto })
  async compareTokens(
    @Body() compareDto: TokenComparisonDto,
  ) {
    const symbols = compareDto.symbols.split(',').map(s => s.trim());
    return this.tokenMetricsService.compareTokens(symbols, compareDto.chain);
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  async getSupportedChains() {
    return {
      chains: this.tokenMetricsService.getSupportedChains(),
    };
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Get supported tokens' })
  async getSupportedTokens() {
    return {
      tokens: this.tokenMetricsService.getSupportedTokens(),
    };
  }
}

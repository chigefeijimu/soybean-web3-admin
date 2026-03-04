import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { 
  LiquidityPoolScannerService, 
  PoolQueryDto, 
  PoolListDto, 
  PoolDetailDto,
  PoolComparisonDto,
  TrendingPoolDto,
  PoolStatsDto,
  PoolSearchDto
} from './liquidity-pool-scanner.service';

@ApiTags('Liquidity Pool Scanner')
@Controller()
export class LiquidityPoolScannerController {
  constructor(private readonly poolService: LiquidityPoolScannerService) {}

  @Get('pools')
  @ApiOperation({ summary: 'Get liquidity pools with filters' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name' })
  @ApiQuery({ name: 'dex', required: false, description: 'DEX name' })
  @ApiQuery({ name: 'token', required: false, description: 'Token symbol' })
  @ApiQuery({ name: 'minTvl', required: false, description: 'Minimum TVL in USD' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by (tvl, volume, apy, fees)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Page size' })
  @ApiResponse({ status: 200, description: 'List of liquidity pools', type: PoolListDto })
  getPools(@Query() query: PoolQueryDto) {
    return this.poolService.getPools(query);
  }

  @Get('pool/:address')
  @ApiOperation({ summary: 'Get pool details by address' })
  @ApiParam({ name: 'address', description: 'Pool address' })
  @ApiResponse({ status: 200, description: 'Pool details', type: PoolDetailDto })
  getPoolByAddress(@Param('address') address: string) {
    return this.poolService.getPoolByAddress(address);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple pools' })
  @ApiResponse({ status: 200, description: 'Pool comparison', type: [PoolDetailDto] })
  comparePools(@Body() body: PoolComparisonDto) {
    return this.poolService.comparePools(body.pools);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending pools' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  @ApiResponse({ status: 200, description: 'Trending pools', type: [TrendingPoolDto] })
  getTrendingPools(@Query('limit') limit?: number) {
    return this.poolService.getTrendingPools(limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get overall pool statistics' })
  @ApiResponse({ status: 200, description: 'Pool statistics', type: PoolStatsDto })
  getPoolStats() {
    return this.poolService.getPoolStats();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search pools by token pair or address' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain filter' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results limit' })
  @ApiResponse({ status: 200, description: 'Search results', type: [PoolDetailDto] })
  searchPools(@Query() query: PoolSearchDto) {
    return this.poolService.searchPools(query);
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains' })
  @ApiResponse({ status: 200, description: 'List of supported chains', type: [String] })
  getSupportedChains() {
    return this.poolService.getSupportedChains();
  }

  @Get('dexes')
  @ApiOperation({ summary: 'Get supported DEXes' })
  @ApiResponse({ status: 200, description: 'List of supported DEXes', type: [String] })
  getSupportedDexes() {
    return this.poolService.getSupportedDexes();
  }

  @Get('il-calculator')
  @ApiOperation({ summary: 'Calculate impermanent loss for a position' })
  @ApiQuery({ name: 'token0Amount', required: true, description: 'Amount of token0' })
  @ApiQuery({ name: 'token1Amount', required: true, description: 'Amount of token1' })
  @ApiQuery({ name: 'initialPrice', required: true, description: 'Initial price of token0 in USD' })
  @ApiQuery({ name: 'currentPrice', required: true, description: 'Current price of token0 in USD' })
  @ApiResponse({ status: 200, description: 'Impermanent loss calculation' })
  calculateIL(
    @Query('token0Amount') token0Amount: number,
    @Query('token1Amount') token1Amount: number,
    @Query('initialPrice') initialPrice: number,
    @Query('currentPrice') currentPrice: number
  ) {
    return this.poolService.calculateIL(token0Amount, token1Amount, initialPrice, currentPrice);
  }
}

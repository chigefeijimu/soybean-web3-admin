import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DexAggregatorService } from './dex-aggregator.service';

@ApiTags('Dex Aggregator')
@Controller('web3/dex')
export class DexAggregatorController {
  constructor(private readonly dexService: DexAggregatorService) {}

  @Get('prices')
  @ApiOperation({ summary: 'Get aggregated token prices from multiple DEXs' })
  @ApiQuery({ name: 'tokenAddress', required: true, description: 'Token contract address' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain: ethereum, polygon, arbitrum, optimism, bsc' })
  async getAggregatedPrices(
    @Query('tokenAddress') tokenAddress: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    const prices = await this.dexService.getAggregatedPrices(tokenAddress, chain);
    return { success: true, data: prices };
  }

  @Get('best-price')
  @ApiOperation({ summary: 'Find best price across DEXs for token pair' })
  @ApiQuery({ name: 'fromToken', required: true, description: 'From token address' })
  @ApiQuery({ name: 'toToken', required: true, description: 'To token address' })
  @ApiQuery({ name: 'amount', required: true, description: 'Amount to swap (in wei)' })
  @ApiQuery({ name: 'chain', required: false, description: 'Chain name' })
  async getBestPrice(
    @Query('fromToken') fromToken: string,
    @Query('toToken') toToken: string,
    @Query('amount') amount: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    const bestPrice = await this.dexService.findBestPrice(fromToken, toToken, amount, chain);
    return { success: true, data: bestPrice };
  }

  @Get('quote')
  @ApiOperation({ summary: 'Get swap quote from best DEX' })
  @ApiQuery({ name: 'fromToken', required: true })
  @ApiQuery({ name: 'toToken', required: true })
  @ApiQuery({ name: 'amount', required: true })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'slippage', required: false, description: 'Slippage tolerance %' })
  async getQuote(
    @Query('fromToken') fromToken: string,
    @Query('toToken') toToken: string,
    @Query('amount') amount: string,
    @Query('chain') chain: string = 'ethereum',
    @Query('slippage') slippage: string = '0.5',
  ) {
    const quote = await this.dexService.getSwapQuote(fromToken, toToken, amount, chain, parseFloat(slippage));
    return { success: true, data: quote };
  }

  @Get('pools')
  @ApiOperation({ summary: 'Get liquidity pools for token pair' })
  @ApiQuery({ name: 'tokenA', required: true })
  @ApiQuery({ name: 'tokenB', required: true })
  @ApiQuery({ name: 'chain', required: false })
  async getPools(
    @Query('tokenA') tokenA: string,
    @Query('tokenB') tokenB: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    const pools = await this.dexService.getLiquidityPools(tokenA, tokenB, chain);
    return { success: true, data: pools };
  }

  @Get('dexes')
  @ApiOperation({ summary: 'List supported DEXs and their stats' })
  async getSupportedDexes() {
    const dexes = await this.dexService.getSupportedDexes();
    return { success: true, data: dexes };
  }

  @Get('tokens')
  @ApiOperation({ summary: 'Search tokens by name or symbol' })
  @ApiQuery({ name: 'query', required: true, description: 'Token name or symbol' })
  @ApiQuery({ name: 'chain', required: false })
  async searchTokens(
    @Query('query') query: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    const tokens = await this.dexService.searchTokens(query, chain);
    return { success: true, data: tokens };
  }
}

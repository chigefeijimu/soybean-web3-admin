import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CrossChainSwapAggregatorService } from './cross-chain-swap-aggregator.service';

@Controller('cross-chain-swap-aggregator')
export class CrossChainSwapAggregatorController {
  constructor(
    private readonly swapAggregatorService: CrossChainSwapAggregatorService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'cross-chain-swap-aggregator' };
  }

  @Get('supported-chains')
  getSupportedChains() {
    return this.swapAggregatorService.getSupportedChains();
  }

  @Get('supported-dexs')
  getSupportedDexs() {
    return this.swapAggregatorService.getSupportedDexs();
  }

  @Get('supported-tokens')
  getSupportedTokens(@Query('chain') chain: string) {
    return this.swapAggregatorService.getSupportedTokens(chain);
  }

  @Post('quote')
  getQuote(@Body() quoteRequest: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: number;
  }) {
    return this.swapAggregatorService.getQuote(quoteRequest);
  }

  @Post('compare-routes')
  compareRoutes(@Body() routeRequest: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
  }) {
    return this.swapAggregatorService.compareRoutes(routeRequest);
  }

  @Post('best-route')
  findBestRoute(@Body() routeRequest: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
    preference?: 'fastest' | 'cheapest' | 'best';
  }) {
    return this.swapAggregatorService.findBestRoute(routeRequest);
  }

  @Get('market-overview')
  getMarketOverview() {
    return this.swapAggregatorService.getMarketOverview();
  }

  @Get('token-price')
  getTokenPrice(@Query('chain') chain: string, @Query('token') token: string) {
    return this.swapAggregatorService.getTokenPrice(chain, token);
  }

  @Post('swap-estimate')
  getSwapEstimate(@Body() estimateRequest: {
    fromChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
    dex?: string;
  }) {
    return this.swapAggregatorService.getSwapEstimate(estimateRequest);
  }

  @Get('popular-routes')
  getPopularRoutes() {
    return this.swapAggregatorService.getPopularRoutes();
  }

  @Post('route-details')
  getRouteDetails(@Body() routeRequest: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
  }) {
    return this.swapAggregatorService.getRouteDetails(routeRequest);
  }
}

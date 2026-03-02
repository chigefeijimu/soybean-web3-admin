import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { CrossChainSwapService, SwapQuote } from './cross-chain-swap.service';

@Controller('web3/cross-chain-swap')
export class CrossChainSwapController {
  constructor(private readonly swapService: CrossChainSwapService) {}

  @Get('chains')
  async getSupportedChains() {
    return this.swapService.getSupportedChains();
  }

  @Get('tokens')
  async getSupportedTokens(@Query('chain') chain: string) {
    return this.swapService.getSupportedTokens(chain);
  }

  @Get('bridges')
  async getBridgeList() {
    return this.swapService.getBridgeList();
  }

  @Get('routes')
  async getPopularRoutes() {
    return this.swapService.getPopularRoutes();
  }

  @Get('quotes')
  async getQuotes(
    @Query('fromChain') fromChain: string,
    @Query('toChain') toChain: string,
    @Query('fromToken') fromToken: string,
    @Query('toToken') toToken: string,
    @Query('amount') amount: string,
  ): Promise<SwapQuote[]> {
    return this.swapService.getQuotes({
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
    });
  }

  @Get('estimate')
  async getSwapEstimate(
    @Query('fromChain') fromChain: string,
    @Query('toChain') toChain: string,
    @Query('fromToken') fromToken: string,
    @Query('toToken') toToken: string,
    @Query('amount') amount: string,
    @Query('bridge') bridge?: string,
  ): Promise<SwapQuote> {
    return this.swapService.getSwapEstimate({
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      bridge,
    });
  }
}

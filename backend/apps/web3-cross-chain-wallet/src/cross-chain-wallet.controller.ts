import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CrossChainWalletService } from './cross-chain-wallet.service';

@Controller('web3/cross-chain-wallet')
export class CrossChainWalletController {
  constructor(private readonly crossChainWalletService: CrossChainWalletService) {}

  @Get('chains')
  async getSupportedChains() {
    return {
      success: true,
      data: await this.crossChainWalletService.getSupportedChains(),
    };
  }

  @Get('balance/:address')
  async getWalletBalances(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains ? chains.split(',') : undefined;
    return {
      success: true,
      data: await this.crossChainWalletService.getWalletBalances(address, chainList),
    };
  }

  @Get('portfolio/:address')
  async getPortfolioValue(@Param('address') address: string) {
    return {
      success: true,
      data: await this.crossChainWalletService.getTotalPortfolioValue(address),
    };
  }

  @Post('transfer/quote')
  async getTransferQuote(
    @Body() body: {
      fromChain: string;
      toChain: string;
      token: string;
      amount: string;
    },
  ) {
    return {
      success: true,
      data: await this.crossChainWalletService.getCrossChainTransferQuote(
        body.fromChain,
        body.toChain,
        body.token,
        body.amount,
      ),
    };
  }

  @Get('whales')
  async searchWhales(
    @Query('minValue') minValue?: string,
    @Query('chains') chains?: string,
  ) {
    const min = minValue ? parseFloat(minValue) : 100000;
    const chainList = chains ? chains.split(',') : undefined;
    return {
      success: true,
      data: await this.crossChainWalletService.searchWalletsByBalance(min, chainList),
    };
  }
}

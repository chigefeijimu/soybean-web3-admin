import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LiquidityPoolService } from './liquidity-pool.service';

@Controller('web3/liquidity-pool')
export class LiquidityPoolController {
  constructor(private readonly liquidityPoolService: LiquidityPoolService) {}

  @Get('pool-info')
  async getPoolInfo(
    @Query('token0') token0Address: string,
    @Query('token1') token1Address: string,
    @Query('fee') fee: string,
  ) {
    const feeNum = fee ? parseInt(fee, 10) : 3000;
    return this.liquidityPoolService.getPoolInfo(token0Address, token1Address, feeNum);
  }

  @Get('wallet/:address')
  async getWalletPositions(@Param('address') walletAddress: string) {
    return this.liquidityPoolService.getWalletPositions(walletAddress);
  }

  @Get('top-pools')
  async getTopPools(
    @Query('chainId') chainId: string,
    @Query('limit') limit: string,
  ) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    const lim = limit ? parseInt(limit, 10) : 10;
    return this.liquidityPoolService.getTopPools(chain, lim);
  }

  @Post('calculate-value')
  async calculatePositionValue(@Body() position: any) {
    return {
      value: await this.liquidityPoolService.calculatePositionValue(position),
    };
  }

  @Get('fee-recommendation')
  async getFeeRecommendation(
    @Query('token0') token0Symbol: string,
    @Query('token1') token1Symbol: string,
  ) {
    const fee = this.liquidityPoolService.getRecommendedFeeTier(token0Symbol, token1Symbol);
    return { recommendedFee: fee };
  }
}

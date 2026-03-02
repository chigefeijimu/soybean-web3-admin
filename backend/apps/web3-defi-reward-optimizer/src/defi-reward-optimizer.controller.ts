import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { 
  DefiRewardOptimizerService, 
  RewardPool, 
  RewardOptimizationInput,
  OptimizationResult 
} from './defi-reward-optimizer.service';

@Controller('web3/defi-reward-optimizer')
export class DefiRewardOptimizerController {
  constructor(private readonly service: DefiRewardOptimizerService) {}

  /**
   * Get all reward pools with optional filtering
   */
  @Get('pools')
  getPools(
    @Query('chains') chains?: string,
    @Query('protocols') protocols?: string
  ): RewardPool[] {
    const chainsArray = chains ? chains.split(',') : undefined;
    const protocolsArray = protocols ? protocols.split(',') : undefined;
    return this.service.getPools(chainsArray, protocolsArray);
  }

  /**
   * Get pools by token
   */
  @Get('pools/token/:token')
  getPoolsByToken(
    @Query('token') token: string
  ): RewardPool[] {
    return this.service.getPoolsByToken(token);
  }

  /**
   * Get top pools by APY
   */
  @Get('pools/top')
  getTopPools(
    @Query('limit') limit: number = 10
  ): RewardPool[] {
    return this.service.getTopPools(limit);
  }

  /**
   * Get pools by chain
   */
  @Get('pools/chain/:chainId')
  getPoolsByChain(
    @Query('chainId') chainId: number
  ): RewardPool[] {
    return this.service.getPoolsByChain(chainId);
  }

  /**
   * Optimize rewards based on input parameters
   */
  @Post('optimize')
  optimizeRewards(
    @Body() input: RewardOptimizationInput
  ): OptimizationResult {
    return this.service.optimizeRewards(input);
  }

  /**
   * Quick optimization with query parameters
   */
  @Get('optimize')
  quickOptimize(
    @Query('principal') principal: number,
    @Query('token') token: string,
    @Query('durationDays') durationDays: number = 30,
    @Query('chains') chains?: string,
    @Query('protocols') protocols?: string,
    @Query('riskTolerance') riskTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): OptimizationResult {
    const input: RewardOptimizationInput = {
      principal: principal || 1000,
      token: token || 'USDC',
      durationDays: durationDays || 30,
      chains: chains ? chains.split(',') : undefined,
      protocols: protocols ? protocols.split(',') : undefined,
      riskTolerance
    };
    return this.service.optimizeRewards(input);
  }

  /**
   * Compare rewards across chains for a token
   */
  @Get('compare')
  compareChains(
    @Query('token') token: string,
    @Query('principal') principal: number = 1000,
    @Query('durationDays') durationDays: number = 30
  ): any[] {
    return this.service.compareChains(token || 'USDC', principal || 1000, durationDays || 30);
  }

  /**
   * Get market statistics
   */
  @Get('stats')
  getMarketStats(): any {
    return this.service.getMarketStats();
  }

  /**
   * Calculate reward for a specific pool
   */
  @Get('calculate')
  calculateReward(
    @Query('poolIndex') poolIndex: number,
    @Query('principal') principal: number,
    @Query('durationDays') durationDays: number
  ): any {
    const pools = this.service.getPools();
    if (poolIndex < 0 || poolIndex >= pools.length) {
      return { error: 'Invalid pool index' };
    }
    return this.service.calculateReward(pools[poolIndex], principal, durationDays);
  }

  /**
   * Get supported chains
   */
  @Get('chains')
  getSupportedChains() {
    return ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'BSC', 'Base'];
  }

  /**
   * Get supported protocols
   */
  @Get('protocols')
  getSupportedProtocols() {
    return ['Aave', 'Compound', 'Lido', 'Yearn', 'Curve', 'Uniswap', 'QuickSwap', 'GMX', 'Velodrome', 'Trader Joe', 'PancakeSwap', 'Venus', 'Aerodrome', 'Rocket Pool'];
  }

  /**
   * Get supported tokens
   */
  @Get('tokens')
  getSupportedTokens() {
    return ['USDC', 'USDT', 'ETH', 'stETH', 'rETH', '3CRV', '2CRV', 'CAKE', 'VELO', 'JOE', 'AERO', 'QUICK', 'GMX', 'LDO', 'RPL'];
  }
}

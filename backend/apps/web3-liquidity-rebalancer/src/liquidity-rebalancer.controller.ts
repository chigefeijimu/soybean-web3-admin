import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LiquidityRebalancerService } from './liquidity-rebalancer.service';

@Controller('liquidity-rebalancer')
export class LiquidityRebalancerController {
  constructor(private readonly liquidityRebalancerService: LiquidityRebalancerService) {}

  @Get('positions')
  async getPositions(
    @Query('chain') chain?: string,
    @Query('protocol') protocol?: string,
  ) {
    return this.liquidityRebalancerService.getPositions(chain, protocol);
  }

  @Get('pools/top')
  async getTopPools(@Query('limit') limit?: number) {
    return this.liquidityRebalancerService.getTopPools(limit || 10);
  }

  @Get('pools/by-chain')
  async getPoolsByChain(@Query('chain') chain: string) {
    return this.liquidityRebalancerService.getPoolsByChain(chain);
  }

  @Get('pools/by-protocol')
  async getPoolsByProtocol(@Query('protocol') protocol: string) {
    return this.liquidityRebalancerService.getPoolsByProtocol(protocol);
  }

  @Get('stats/chains')
  async getChainStats() {
    return this.liquidityRebalancerService.getChainStats();
  }

  @Get('stats/protocols')
  async getProtocolStats() {
    return this.liquidityRebalancerService.getProtocolStats();
  }

  @Post('analyze')
  async analyzeRebalance(@Body() request: any) {
    return this.liquidityRebalancerService.analyzeRebalance(request);
  }
}

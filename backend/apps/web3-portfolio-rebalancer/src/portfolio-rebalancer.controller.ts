import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PortfolioRebalancerService } from './portfolio-rebalancer.service';

interface TargetAllocation {
  symbol: string;
  percentage: number;
}

@Controller('portfolio-rebalancer')
export class PortfolioRebalancerController {
  constructor(private readonly rebalancerService: PortfolioRebalancerService) {}

  @Get('portfolio')
  async getPortfolio(
    @Query('address') address: string,
    @Query('chainId') chainId: string
  ) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    return this.rebalancerService.getCurrentPortfolio(address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1', chain);
  }

  @Post('plan')
  async generatePlan(
    @Body() body: { address: string; targetAllocation: TargetAllocation[]; chainId?: number; slippageTolerance?: number }
  ) {
    const { address, targetAllocation, chainId, slippageTolerance } = body;
    return this.rebalancerService.generateRebalancePlan(
      address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
      targetAllocation,
      chainId || 1,
      slippageTolerance || 0.5
    );
  }

  @Get('strategies')
  async getStrategies() {
    return this.rebalancerService.getPresetStrategies();
  }
}

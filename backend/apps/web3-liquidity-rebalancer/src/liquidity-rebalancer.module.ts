import { Module } from '@nestjs/common';
import { LiquidityRebalancerController } from './liquidity-rebalancer.controller';
import { LiquidityRebalancerService } from './liquidity-rebalancer.service';

@Module({
  controllers: [LiquidityRebalancerController],
  providers: [LiquidityRebalancerService],
  exports: [LiquidityRebalancerService],
})
export class LiquidityRebalancerModule {}

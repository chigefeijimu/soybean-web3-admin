import { Module } from '@nestjs/common';
import { CrossChainRebalancerController } from './cross-chain-rebalancer.controller';
import { CrossChainRebalancerService } from './cross-chain-rebalancer.service';

@Module({
  controllers: [CrossChainRebalancerController],
  providers: [CrossChainRebalancerService],
  exports: [CrossChainRebalancerService],
})
export class CrossChainRebalancerModule {}

import { Module } from '@nestjs/common';
import { CrossChainSwapAggregatorController } from './cross-chain-swap-aggregator.controller';
import { CrossChainSwapAggregatorService } from './cross-chain-swap-aggregator.service';

@Module({
  imports: [],
  controllers: [CrossChainSwapAggregatorController],
  providers: [CrossChainSwapAggregatorService],
})
export class CrossChainSwapAggregatorModule {}

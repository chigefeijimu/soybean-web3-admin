import { Module } from '@nestjs/common';
import { CrossChainTxTrackerController } from './cross-chain-tx-tracker.controller';
import { CrossChainTxTrackerService } from './cross-chain-tx-tracker.service';

@Module({
  controllers: [CrossChainTxTrackerController],
  providers: [CrossChainTxTrackerService],
  exports: [CrossChainTxTrackerService],
})
export class CrossChainTxTrackerModule {}

import { Module } from '@nestjs/common';
import { Web3CrossChainBridgeAnalyticsController } from './web3-cross-chain-bridge-analytics.controller';
import { Web3CrossChainBridgeAnalyticsService } from './web3-cross-chain-bridge-analytics.service';

@Module({
  controllers: [Web3CrossChainBridgeAnalyticsController],
  providers: [Web3CrossChainBridgeAnalyticsService],
  exports: [Web3CrossChainBridgeAnalyticsService],
})
export class Web3CrossChainBridgeAnalyticsModule {}

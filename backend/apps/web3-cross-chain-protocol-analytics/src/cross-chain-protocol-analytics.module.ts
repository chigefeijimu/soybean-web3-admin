import { Module } from '@nestjs/common';
import { CrossChainProtocolAnalyticsController } from './cross-chain-protocol-analytics.controller';
import { CrossChainProtocolAnalyticsService } from './cross-chain-protocol-analytics.service';

@Module({
  controllers: [CrossChainProtocolAnalyticsController],
  providers: [CrossChainProtocolAnalyticsService],
  exports: [CrossChainProtocolAnalyticsService],
})
export class CrossChainProtocolAnalyticsModule {}

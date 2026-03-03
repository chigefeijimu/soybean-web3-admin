import { Module } from '@nestjs/common';
import { LiquidityMiningAnalyticsController } from './liquidity-mining-analytics.controller';
import { LiquidityMiningAnalyticsService } from './liquidity-mining-analytics.service';

@Module({
  imports: [],
  controllers: [LiquidityMiningAnalyticsController],
  providers: [LiquidityMiningAnalyticsService],
})
export class LiquidityMiningAnalyticsModule {}

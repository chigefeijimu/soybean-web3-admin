import { Module } from '@nestjs/common';
import { YieldAnalyticsController } from './yield-analytics.controller';
import { YieldAnalyticsService } from './yield-analytics.service';

@Module({
  controllers: [YieldAnalyticsController],
  providers: [YieldAnalyticsService],
  exports: [YieldAnalyticsService],
})
export class YieldAnalyticsModule {}

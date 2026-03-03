import { Module } from '@nestjs/common';
import { DefiUsageAnalyticsController } from './defi-usage-analytics.controller';
import { DefiUsageAnalyticsService } from './defi-usage-analytics.service';

@Module({
  controllers: [DefiUsageAnalyticsController],
  providers: [DefiUsageAnalyticsService],
  exports: [DefiUsageAnalyticsService],
})
export class DefiUsageAnalyticsModule {}

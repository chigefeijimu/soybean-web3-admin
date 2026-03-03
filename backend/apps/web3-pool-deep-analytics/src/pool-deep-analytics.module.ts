import { Module } from '@nestjs/common';
import { PoolDeepAnalyticsController } from './pool-deep-analytics.controller';
import { PoolDeepAnalyticsService } from './pool-deep-analytics.service';

@Module({
  imports: [],
  controllers: [PoolDeepAnalyticsController],
  providers: [PoolDeepAnalyticsService],
})
export class AppModule {}

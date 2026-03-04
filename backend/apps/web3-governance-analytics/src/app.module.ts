import { Module } from '@nestjs/common';
import { GovernanceAnalyticsController } from './governance-analytics.controller';
import { GovernanceAnalyticsService } from './governance-analytics.service';

@Module({
  imports: [],
  controllers: [GovernanceAnalyticsController],
  providers: [GovernanceAnalyticsService],
})
export class AppModule {}

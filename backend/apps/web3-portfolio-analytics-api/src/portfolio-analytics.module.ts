import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PortfolioAnalyticsController } from './portfolio-analytics.controller';
import { PortfolioAnalyticsService } from './portfolio-analytics.service';

@Module({
  imports: [HttpModule],
  controllers: [PortfolioAnalyticsController],
  providers: [PortfolioAnalyticsService],
  exports: [PortfolioAnalyticsService],
})
export class AppModule {}

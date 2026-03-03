import { Module } from '@nestjs/common';
import { PortfolioHealthDashboardController } from './portfolio-health-dashboard.controller';
import { PortfolioHealthDashboardService } from './portfolio-health-dashboard.service';

@Module({
  controllers: [PortfolioHealthDashboardController],
  providers: [PortfolioHealthDashboardService],
  exports: [PortfolioHealthDashboardService]
})
export class PortfolioHealthDashboardModule {}

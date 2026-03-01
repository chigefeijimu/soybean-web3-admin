import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PortfolioPerformanceController } from './portfolio-performance.controller';
import { PortfolioPerformanceService } from './portfolio-performance.service';

@Module({
  imports: [HttpModule],
  controllers: [PortfolioPerformanceController],
  providers: [PortfolioPerformanceService],
  exports: [PortfolioPerformanceService],
})
export class PortfolioPerformanceModule {}

import { Module } from '@nestjs/common';
import { DefiRevenueTrackerController } from './defi-revenue-tracker.controller';
import { DefiRevenueTrackerService } from './defi-revenue-tracker.service';

@Module({
  controllers: [DefiRevenueTrackerController],
  providers: [DefiRevenueTrackerService],
  exports: [DefiRevenueTrackerService],
})
export class AppModule {}

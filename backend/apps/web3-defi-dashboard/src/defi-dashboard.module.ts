import { Module } from '@nestjs/common';
import { DefiDashboardController } from './defi-dashboard.controller';
import { DefiDashboardService } from './defi-dashboard.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DefiDashboardController],
  providers: [DefiDashboardService],
})
export class DefiDashboardModule {}

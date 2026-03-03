import { Module } from '@nestjs/common';
import { GasSmartDashboardController } from './gas-smart-dashboard.controller';
import { GasSmartDashboardService } from './gas-smart-dashboard.service';

@Module({
  controllers: [GasSmartDashboardController],
  providers: [GasSmartDashboardService],
  exports: [GasSmartDashboardService],
})
export class GasSmartDashboardModule {}

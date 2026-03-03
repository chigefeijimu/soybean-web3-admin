import { Module } from '@nestjs/common';
import { DefiCollateralTrackerController, DefiCollateralTrackerService } from './defi-collateral-tracker.service';

@Module({
  controllers: [DefiCollateralTrackerController],
  providers: [DefiCollateralTrackerService],
  exports: [DefiCollateralTrackerService],
})
export class DefiCollateralTrackerModule {}

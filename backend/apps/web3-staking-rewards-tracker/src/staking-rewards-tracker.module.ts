import { Module } from '@nestjs/common';
import { StakingRewardsTrackerController } from './staking-rewards-tracker.controller';
import { StakingRewardsTrackerService } from './staking-rewards-tracker.service';

@Module({
  controllers: [StakingRewardsTrackerController],
  providers: [StakingRewardsTrackerService],
  exports: [StakingRewardsTrackerService],
})
export class StakingRewardsTrackerModule {}

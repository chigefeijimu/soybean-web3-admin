import { Module } from '@nestjs/common';
import { StakingRewardsTrackerModule } from './staking-rewards-tracker.module';

@Module({
  imports: [StakingRewardsTrackerModule],
})
export class AppModule {}

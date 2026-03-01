import { Module } from '@nestjs/common';
import { VotingTrackerController } from './voting-tracker.controller';

@Module({
  controllers: [VotingTrackerController],
  providers: [],
  exports: [],
})
export class VotingTrackerModule {}

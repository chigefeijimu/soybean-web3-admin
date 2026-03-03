import { Module } from '@nestjs/common';
import { AirdropTrackerController } from './airdrop-tracker.controller';
import { AirdropTrackerService } from './airdrop-tracker.service';

@Module({
  controllers: [AirdropTrackerController],
  providers: [AirdropTrackerService],
  exports: [AirdropTrackerService],
})
export class AirdropTrackerModule {}

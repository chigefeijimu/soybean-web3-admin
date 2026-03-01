import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AirdropTrackerController } from './airdrop-tracker.controller';
import { AirdropTrackerService } from './airdrop-tracker.service';

@Module({
  imports: [HttpModule],
  controllers: [AirdropTrackerController],
  providers: [AirdropTrackerService],
  exports: [AirdropTrackerService],
})
export class AirdropTrackerModule {}

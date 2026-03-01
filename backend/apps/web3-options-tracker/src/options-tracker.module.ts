import { Module } from '@nestjs/common';
import { OptionsTrackerController } from './options-tracker.controller';
import { OptionsTrackerService } from './options-tracker.service';

@Module({
  controllers: [OptionsTrackerController],
  providers: [OptionsTrackerService],
  exports: [OptionsTrackerService],
})
export class OptionsTrackerModule {}

import { Module } from '@nestjs/common';
import { ValidatorTrackerController } from './validator-tracker.controller';
import { ValidatorTrackerService } from './validator-tracker.service';

@Module({
  imports: [],
  controllers: [ValidatorTrackerController],
  providers: [ValidatorTrackerService],
})
export class AppModule {}

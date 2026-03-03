import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NetWorthTrackerController } from './net-worth-tracker.controller';
import { NetWorthTrackerService } from './net-worth-tracker.service';

@Module({
  imports: [HttpModule],
  controllers: [NetWorthTrackerController],
  providers: [NetWorthTrackerService],
  exports: [NetWorthTrackerService],
})
export class AppModule {}

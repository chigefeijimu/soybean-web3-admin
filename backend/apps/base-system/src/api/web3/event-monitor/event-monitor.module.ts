import { Module } from '@nestjs/common';
import { EventMonitorController } from './event-monitor.controller';
import { EventMonitorService } from './event-monitor.service';

@Module({
  controllers: [EventMonitorController],
  providers: [EventMonitorService],
  exports: [EventMonitorService],
})
export class EventMonitorModule {}

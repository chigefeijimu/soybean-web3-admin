import { Module } from '@nestjs/common';
import { MempoolMonitorController } from './mempool-monitor.controller';
import { MempoolMonitorService } from './mempool-monitor.service';

@Module({
  controllers: [MempoolMonitorController],
  providers: [MempoolMonitorService],
  exports: [MempoolMonitorService],
})
export class MempoolMonitorModule {}

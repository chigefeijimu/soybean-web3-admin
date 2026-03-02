import { Module } from '@nestjs/common';
import { TxTimelineController } from './tx-timeline.controller';
import { TxTimelineService } from './tx-timeline.service';

@Module({
  controllers: [TxTimelineController],
  providers: [TxTimelineService],
  exports: [TxTimelineService],
})
export class TxTimelineModule {}

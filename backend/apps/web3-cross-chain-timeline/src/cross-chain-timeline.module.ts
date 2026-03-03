import { Module } from '@nestjs/common';
import { CrossChainTimelineController } from './cross-chain-timeline.controller';
import { CrossChainTimelineService } from './cross-chain-timeline.service';

@Module({
  controllers: [CrossChainTimelineController],
  providers: [CrossChainTimelineService],
})
export class CrossChainTimelineModule {}

import { Module } from '@nestjs/common';
import { DataVizController } from './data-viz.controller';
import { DataVizService } from './data-viz.service';

@Module({
  controllers: [DataVizController],
  providers: [DataVizService],
  exports: [DataVizService],
})
export class DataVizModule {}

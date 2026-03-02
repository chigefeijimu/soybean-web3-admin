import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BridgeComparisonController } from './bridge-comparison.controller';
import { BridgeComparisonService } from './bridge-comparison.service';

@Module({
  imports: [HttpModule],
  controllers: [BridgeComparisonController],
  providers: [BridgeComparisonService],
  exports: [BridgeComparisonService],
})
export class BridgeComparisonModule {}

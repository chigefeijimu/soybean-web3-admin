import { Module } from '@nestjs/common';
import { DefiTvlComparatorController } from './defi-tvl-comparator.controller';
import { DefiTvlComparatorService } from './defi-tvl-comparator.service';

@Module({
  controllers: [DefiTvlComparatorController],
  providers: [DefiTvlComparatorService],
  exports: [DefiTvlComparatorService],
})
export class DefiTvlComparatorModule {}

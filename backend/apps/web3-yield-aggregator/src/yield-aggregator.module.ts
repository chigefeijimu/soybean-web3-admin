import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { YieldAggregatorController } from './yield-aggregator.controller';
import { YieldAggregatorService } from './yield-aggregator.service';

@Module({
  imports: [HttpModule],
  controllers: [YieldAggregatorController],
  providers: [YieldAggregatorService],
  exports: [YieldAggregatorService],
})
export class YieldAggregatorModule {}

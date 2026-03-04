import { Module } from '@nestjs/common';
import { DefiPositionAggregatorController } from './src/defi-position-aggregator.controller';
import { DefiPositionAggregatorService } from './src/defi-position-aggregator.service';

@Module({
  imports: [],
  controllers: [DefiPositionAggregatorController],
  providers: [DefiPositionAggregatorService],
})
export class AppModule {}

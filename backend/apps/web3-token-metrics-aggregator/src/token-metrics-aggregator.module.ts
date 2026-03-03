import { Module } from '@nestjs/common';
import { TokenMetricsAggregatorController } from './token-metrics-aggregator.controller';
import { TokenMetricsAggregatorService } from './token-metrics-aggregator.service';

@Module({
  controllers: [TokenMetricsAggregatorController],
  providers: [TokenMetricsAggregatorService],
  exports: [TokenMetricsAggregatorService],
})
export class TokenMetricsAggregatorModule {}

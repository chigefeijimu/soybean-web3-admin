import { Module } from '@nestjs/common';
import { DefiProtocolMetricsController } from './defi-protocol-metrics.controller';
import { DefiProtocolMetricsService } from './defi-protocol-metrics.service';

@Module({
  controllers: [DefiProtocolMetricsController],
  providers: [DefiProtocolMetricsService],
  exports: [DefiProtocolMetricsService],
})
export class DefiProtocolMetricsModule {}

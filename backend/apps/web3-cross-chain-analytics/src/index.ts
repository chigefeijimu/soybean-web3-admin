import { CrossChainAnalyticsController } from './cross-chain-analytics.controller';
import { CrossChainAnalyticsService } from './cross-chain-analytics.service';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [CrossChainAnalyticsController],
  providers: [CrossChainAnalyticsService],
  exports: [CrossChainAnalyticsService],
})
export class CrossChainAnalyticsModule {}

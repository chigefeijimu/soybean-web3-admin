import { Module } from '@nestjs/common';
import { DefiMarketOverviewController } from './defi-market-overview.controller';
import { DefiMarketOverviewService } from './defi-market-overview.service';

@Module({
  controllers: [DefiMarketOverviewController],
  providers: [DefiMarketOverviewService],
  exports: [DefiMarketOverviewService],
})
export class DefiMarketOverviewModule {}

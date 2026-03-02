import { Module } from '@nestjs/common';
import { Web3DefiAnalyticsController } from './web3-defi-analytics.controller';

@Module({
  controllers: [Web3DefiAnalyticsController],
  providers: [],
  exports: [],
})
export class Web3DefiAnalyticsModule {}

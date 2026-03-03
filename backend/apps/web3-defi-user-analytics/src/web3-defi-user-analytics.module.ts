import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Web3DefiUserAnalyticsController } from './web3-defi-user-analytics.controller';
import { Web3DefiUserAnalyticsService } from './web3-defi-user-analytics.service';

@Module({
  imports: [HttpModule],
  controllers: [Web3DefiUserAnalyticsController],
  providers: [Web3DefiUserAnalyticsService],
  exports: [Web3DefiUserAnalyticsService],
})
export class Web3DefiUserAnalyticsModule {}

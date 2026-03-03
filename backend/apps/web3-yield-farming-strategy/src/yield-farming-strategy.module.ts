import { Module } from '@nestjs/common';
import { YieldFarmingStrategyController } from './yield-farming-strategy.controller';
import { YieldFarmingStrategyService } from './yield-farming-strategy.service';

@Module({
  controllers: [YieldFarmingStrategyController],
  providers: [YieldFarmingStrategyService],
  exports: [YieldFarmingStrategyService],
})
export class YieldFarmingStrategyModule {}

import { Module } from '@nestjs/common';
import { YieldFarmingOptimizerController } from './yield-farming-optimizer.controller';
import { YieldFarmingOptimizerService } from './yield-farming-optimizer.service';

@Module({
  controllers: [YieldFarmingOptimizerController],
  providers: [YieldFarmingOptimizerService],
  exports: [YieldFarmingOptimizerService],
})
export class YieldFarmingOptimizerModule {}

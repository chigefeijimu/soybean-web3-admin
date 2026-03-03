import { Module } from '@nestjs/common';
import { YieldFarmingOptimizerModule } from './yield-farming-optimizer.module';

@Module({
  imports: [YieldFarmingOptimizerModule],
})
export class AppModule {}

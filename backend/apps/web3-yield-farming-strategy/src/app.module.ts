import { Module } from '@nestjs/common';
import { YieldFarmingStrategyModule } from './yield-farming-strategy.module';

@Module({
  imports: [YieldFarmingStrategyModule],
})
export class AppModule {}

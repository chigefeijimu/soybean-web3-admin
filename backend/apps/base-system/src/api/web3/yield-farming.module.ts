import { Module } from '@nestjs/common';
import { YieldFarmingController } from './yield-farming.controller';
import { YieldFarmingService } from './yield-farming.service';

@Module({
  controllers: [YieldFarmingController],
  providers: [YieldFarmingService],
  exports: [YieldFarmingService],
})
export class YieldFarmingModule {}

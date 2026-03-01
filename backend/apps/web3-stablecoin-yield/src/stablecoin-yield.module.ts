import { Module } from '@nestjs/common';
import { StablecoinYieldController } from './stablecoin-yield.controller';
import { StablecoinYieldService } from './stablecoin-yield.service';

@Module({
  controllers: [StablecoinYieldController],
  providers: [StablecoinYieldService],
  exports: [StablecoinYieldService],
})
export class StablecoinYieldModule {}

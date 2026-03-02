import { Module } from '@nestjs/common';
import { DefiSimulatorController } from './defi-simulator.controller';
import { DefiSimulatorService } from './defi-simulator.service';

@Module({
  controllers: [DefiSimulatorController],
  providers: [DefiSimulatorService],
  exports: [DefiSimulatorService],
})
export class DefiSimulatorModule {}

import { Module } from '@nestjs/common';
import { TxSimulatorController } from './tx-simulator.controller';
import { TxSimulatorService } from './tx-simulator.service';

@Module({
  controllers: [TxSimulatorController],
  providers: [TxSimulatorService],
  exports: [TxSimulatorService],
})
export class TxSimulatorModule {}

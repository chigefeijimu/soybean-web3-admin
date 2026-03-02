import { Module } from '@nestjs/common';
import { TxAcceleratorController } from './tx-accelerator.controller';
import { TxAcceleratorService } from './tx-accelerator.service';

@Module({
  controllers: [TxAcceleratorController],
  providers: [TxAcceleratorService],
  exports: [TxAcceleratorService],
})
export class TxAcceleratorModule {}

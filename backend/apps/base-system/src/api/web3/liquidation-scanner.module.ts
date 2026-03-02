import { Module } from '@nestjs/common';
import { LiquidationScannerController } from './liquidation-scanner.controller';
import { LiquidationScannerService } from './liquidation-scanner.service';

@Module({
  controllers: [LiquidationScannerController],
  providers: [LiquidationScannerService],
  exports: [LiquidationScannerService],
})
export class LiquidationScannerModule {}

import { Module } from '@nestjs/common';
import { LiquidityPoolScannerController } from './liquidity-pool-scanner.controller';
import { LiquidityPoolScannerService } from './liquidity-pool-scanner.service';

@Module({
  controllers: [LiquidityPoolScannerController],
  providers: [LiquidityPoolScannerService],
})
export class LiquidityPoolScannerModule {}

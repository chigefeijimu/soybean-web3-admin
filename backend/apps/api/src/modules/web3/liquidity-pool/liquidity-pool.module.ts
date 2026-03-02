import { Module } from '@nestjs/common';
import { LiquidityPoolController } from './liquidity-pool.controller';
import { LiquidityPoolService } from './liquidity-pool.service';

@Module({
  controllers: [LiquidityPoolController],
  providers: [LiquidityPoolService],
  exports: [LiquidityPoolService],
})
export class LiquidityPoolModule {}

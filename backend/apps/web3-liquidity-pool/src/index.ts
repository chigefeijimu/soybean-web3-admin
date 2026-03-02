import { Module } from '@nestjs/common';
import { LiquidityPoolController } from './src/liquidity-pool.controller';
import { LiquidityPoolService } from './src/liquidity-pool.service';

@Module({
  imports: [],
  controllers: [LiquidityPoolController],
  providers: [LiquidityPoolService],
  exports: [LiquidityPoolService]
})
export class Web3LiquidityPoolModule {}

import { Module } from '@nestjs/common';
import { CrossChainSwapController } from './src/cross-chain-swap.controller';
import { CrossChainSwapService } from './src/cross-chain-swap.service';

@Module({
  controllers: [CrossChainSwapController],
  providers: [CrossChainSwapService],
  exports: [CrossChainSwapService],
})
export class CrossChainSwapModule {}

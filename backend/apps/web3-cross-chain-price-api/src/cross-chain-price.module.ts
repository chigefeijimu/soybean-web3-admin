import { Module } from '@nestjs/common';
import { CrossChainPriceController } from './cross-chain-price.controller';
import { CrossChainPriceService } from './cross-chain-price.service';

@Module({
  controllers: [CrossChainPriceController],
  providers: [CrossChainPriceService],
  exports: [CrossChainPriceService],
})
export class CrossChainPriceModule {}

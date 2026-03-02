import { Module } from '@nestjs/common';
import { CrossChainPriceApiController } from './cross-chain-price-api.controller';
import { CrossChainPriceApiService } from './cross-chain-price-api.service';

@Module({
  controllers: [CrossChainPriceApiController],
  providers: [CrossChainPriceApiService],
  exports: [CrossChainPriceApiService],
})
export class CrossChainPriceApiModule {}

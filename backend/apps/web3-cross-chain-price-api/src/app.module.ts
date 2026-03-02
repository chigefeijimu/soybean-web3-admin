import { Module } from '@nestjs/common';
import { CrossChainPriceModule } from './cross-chain-price.module';

@Module({
  imports: [CrossChainPriceModule],
})
export class AppModule {}

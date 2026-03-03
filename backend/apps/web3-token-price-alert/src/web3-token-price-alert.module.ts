import { Module } from '@nestjs/common';
import { Web3TokenPriceAlertController } from './web3-token-price-alert.controller';
import { Web3TokenPriceAlertService } from './web3-token-price-alert.service';

@Module({
  imports: [],
  controllers: [Web3TokenPriceAlertController],
  providers: [Web3TokenPriceAlertService],
  exports: [Web3TokenPriceAlertService],
})
export class Web3TokenPriceAlertModule {}

import { Module } from '@nestjs/common';
import { ChainlinkPriceController } from './chainlink-price.controller';
import { ChainlinkPriceService } from './chainlink-price.service';

@Module({
  controllers: [ChainlinkPriceController],
  providers: [ChainlinkPriceService],
  exports: [ChainlinkPriceService],
})
export class ChainlinkPriceModule {}

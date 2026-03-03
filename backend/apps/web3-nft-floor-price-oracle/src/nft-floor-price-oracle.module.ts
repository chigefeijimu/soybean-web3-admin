import { Module } from '@nestjs/common';
import { NftFloorPriceOracleController } from './nft-floor-price-oracle.controller';
import { NftFloorPriceOracleService } from './nft-floor-price-oracle.service';

@Module({
  controllers: [NftFloorPriceOracleController],
  providers: [NftFloorPriceOracleService],
  exports: [NftFloorPriceOracleService],
})
export class NftFloorPriceOracleModule {}

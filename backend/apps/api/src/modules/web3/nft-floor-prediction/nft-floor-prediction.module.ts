import { Module } from '@nestjs/common';
import { NftFloorPredictionController } from './nft-floor-prediction.controller';
import { NftFloorPredictionService } from './nft-floor-prediction.service';

@Module({
  controllers: [NftFloorPredictionController],
  providers: [NftFloorPredictionService],
  exports: [NftFloorPredictionService],
})
export class NftFloorPredictionModule {}

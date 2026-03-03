import { Module } from '@nestjs/common';
import { NftFloorPredictionController } from './controller/nft-floor-prediction.controller';
import { NftFloorPredictionService } from './service/nft-floor-prediction.service';

@Module({
  controllers: [NftFloorPredictionController],
  providers: [NftFloorPredictionService],
  exports: [NftFloorPredictionService],
})
export class NftFloorPredictionModule {}

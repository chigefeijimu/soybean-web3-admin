import { Module } from '@nestjs/common';
import { GasPricePredictionController } from './gas-price-prediction.controller';
import { GasPricePredictionService } from './gas-price-prediction.service';

@Module({
  imports: [],
  controllers: [GasPricePredictionController],
  providers: [GasPricePredictionService],
})
export class AppModule {}

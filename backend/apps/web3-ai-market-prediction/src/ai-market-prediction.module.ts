import { Module } from '@nestjs/common';
import { AiMarketPredictionController } from './ai-market-prediction.controller';
import { AiMarketPredictionService } from './ai-market-prediction.service';

@Module({
  controllers: [AiMarketPredictionController],
  providers: [AiMarketPredictionService],
  exports: [AiMarketPredictionService],
})
export class AiMarketPredictionModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiMarketPredictionController } from './ai-market-prediction.controller';
import { AiMarketPredictionService } from './ai-market-prediction.service';

@Module({
  imports: [HttpModule],
  controllers: [AiMarketPredictionController],
  providers: [AiMarketPredictionService],
  exports: [AiMarketPredictionService],
})
export class AiMarketPredictionModule {}

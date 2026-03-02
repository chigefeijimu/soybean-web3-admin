import { Module } from '@nestjs/common';
import { VolatilityAnalyzerController } from './volatility-analyzer.controller';
import { VolatilityAnalyzerService } from './volatility-analyzer.service';

@Module({
  controllers: [VolatilityAnalyzerController],
  providers: [VolatilityAnalyzerService],
  exports: [VolatilityAnalyzerService],
})
export class VolatilityAnalyzerModule {}

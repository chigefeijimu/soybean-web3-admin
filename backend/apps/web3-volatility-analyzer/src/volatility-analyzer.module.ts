import { Module } from '@nestjs/common';
import { VolatilityAnalyzerController } from './volatility-analyzer.controller';
import { VolatilityAnalyzerService } from './volatility-analyzer.service';

@Module({
  imports: [],
  controllers: [VolatilityAnalyzerController],
  providers: [VolatilityAnalyzerService],
})
export class VolatilityAnalyzerModule {}

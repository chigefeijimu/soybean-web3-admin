import { Module } from '@nestjs/common';
import { GasAnalyzerController } from './gas-analyzer.controller';
import { GasAnalyzerService } from './gas-analyzer.service';

@Module({
  controllers: [GasAnalyzerController],
  providers: [GasAnalyzerService],
  exports: [GasAnalyzerService],
})
export class GasAnalyzerModule {}

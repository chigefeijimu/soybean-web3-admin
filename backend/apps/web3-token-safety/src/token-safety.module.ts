import { Module } from '@nestjs/common';
import { TokenSafetyController } from './token-safety.controller';
import { TokenSafetyService } from './token-safety.service';
import { GasAnalyzerController } from './gas-analyzer.controller';
import { GasAnalyzerService } from './gas-analyzer.service';

@Module({
  controllers: [TokenSafetyController, GasAnalyzerController],
  providers: [TokenSafetyService, GasAnalyzerService],
  exports: [TokenSafetyService, GasAnalyzerService],
})
export class TokenSafetyModule {}

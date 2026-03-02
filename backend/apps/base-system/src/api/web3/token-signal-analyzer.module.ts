import { Module } from '@nestjs/common';
import { TokenSignalAnalyzerController } from './token-signal-analyzer.controller';
import { TokenSignalAnalyzerService } from './token-signal-analyzer.service';

@Module({
  controllers: [TokenSignalAnalyzerController],
  providers: [TokenSignalAnalyzerService],
  exports: [TokenSignalAnalyzerService],
})
export class TokenSignalAnalyzerModule {}

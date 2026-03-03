import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TxPatternAnalyzerController } from './tx-pattern-analyzer.controller';
import { TxPatternAnalyzerService } from './tx-pattern-analyzer.service';

@Module({
  imports: [HttpModule],
  controllers: [TxPatternAnalyzerController],
  providers: [TxPatternAnalyzerService],
  exports: [TxPatternAnalyzerService],
})
export class TxPatternAnalyzerModule {}

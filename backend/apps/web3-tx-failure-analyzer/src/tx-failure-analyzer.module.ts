import { Module } from '@nestjs/common';
import { TxFailureAnalyzerController } from './tx-failure-analyzer.controller';
import { TxFailureAnalyzerService } from './tx-failure-analyzer.service';

@Module({
  controllers: [TxFailureAnalyzerController],
  providers: [TxFailureAnalyzerService],
})
export class TxFailureAnalyzerModule {}

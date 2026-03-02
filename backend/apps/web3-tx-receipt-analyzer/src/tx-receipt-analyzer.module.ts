import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TxReceiptAnalyzerController } from './tx-receipt-analyzer.controller';
import { TxReceiptAnalyzerService } from './tx-receipt-analyzer.service';

@Module({
  imports: [HttpModule],
  controllers: [TxReceiptAnalyzerController],
  providers: [TxReceiptAnalyzerService],
})
export class TxReceiptAnalyzerModule {}

import { Module } from '@nestjs/common';
import { DexTradingJournalController } from './dex-trading-journal.controller';
import { DexTradingJournalService } from './dex-trading-journal.service';

@Module({
  controllers: [DexTradingJournalController],
  providers: [DexTradingJournalService],
  exports: [DexTradingJournalService],
})
export class DexTradingJournalModule {}

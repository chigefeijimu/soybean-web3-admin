import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DexTradingJournalController } from './dex-trading-journal.controller';
import { DexTradingJournalService } from './dex-trading-journal.service';

@Module({
  imports: [HttpModule],
  controllers: [DexTradingJournalController],
  providers: [DexTradingJournalService],
  exports: [DexTradingJournalService],
})
export class DexTradingJournalModule {}

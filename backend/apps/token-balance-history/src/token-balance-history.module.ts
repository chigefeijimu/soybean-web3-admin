import { Module } from '@nestjs/common';
import { TokenBalanceHistoryController } from './token-balance-history.controller';
import { TokenBalanceHistoryService } from './token-balance-history.service';

@Module({
  controllers: [TokenBalanceHistoryController],
  providers: [TokenBalanceHistoryService],
  exports: [TokenBalanceHistoryService],
})
export class TokenBalanceHistoryModule {}

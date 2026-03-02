import { Module } from '@nestjs/common';
import { GasHistoryController } from './gas-history.controller';
import { GasHistoryService } from './gas-history.service';

@Module({
  controllers: [GasHistoryController],
  providers: [GasHistoryService],
  exports: [GasHistoryService],
})
export class GasHistoryModule {}

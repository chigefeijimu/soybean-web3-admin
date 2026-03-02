import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GasHistoryController } from './gas-history.controller';
import { GasHistoryService } from './gas-history.service';

@Module({
  imports: [HttpModule],
  controllers: [GasHistoryController],
  providers: [GasHistoryService],
  exports: [GasHistoryService],
})
export class GasHistoryModule {}

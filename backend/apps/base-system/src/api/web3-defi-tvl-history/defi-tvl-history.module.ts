import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DefiTvlHistoryController } from './defi-tvl-history.controller';
import { DefiTvlHistoryService } from './defi-tvl-history.service';

@Module({
  imports: [HttpModule],
  controllers: [DefiTvlHistoryController],
  providers: [DefiTvlHistoryService],
  exports: [DefiTvlHistoryService],
})
export class DefiTvlHistoryModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TokenHistoryController } from './src/token-history.controller';
import { TokenHistoryService } from './src/token-history.service';

@Module({
  imports: [HttpModule],
  controllers: [TokenHistoryController],
  providers: [TokenHistoryService],
  exports: [TokenHistoryService],
})
export class TokenHistoryModule {}

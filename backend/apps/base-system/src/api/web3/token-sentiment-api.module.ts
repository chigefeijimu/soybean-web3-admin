import { Module } from '@nestjs/common';
import { TokenSentimentController } from './token-sentiment.controller';
import { TokenSentimentService } from './token-sentiment.service';

@Module({
  controllers: [TokenSentimentController],
  providers: [TokenSentimentService],
  exports: [TokenSentimentService],
})
export class TokenSentimentApiModule {}

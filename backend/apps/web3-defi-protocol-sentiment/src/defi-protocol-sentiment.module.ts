import { Module } from '@nestjs/common';
import { DefiProtocolSentimentController } from './defi-protocol-sentiment.controller';
import { DefiProtocolSentimentService } from './defi-protocol-sentiment.service';

@Module({
  controllers: [DefiProtocolSentimentController],
  providers: [DefiProtocolSentimentService],
  exports: [DefiProtocolSentimentService],
})
export class DefiProtocolSentimentModule {}

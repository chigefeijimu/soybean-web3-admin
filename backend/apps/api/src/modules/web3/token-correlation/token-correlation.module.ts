import { Module } from '@nestjs/common';
import { TokenCorrelationController } from './token-correlation.controller';
import { TokenCorrelationService } from './token-correlation.service';

@Module({
  controllers: [TokenCorrelationController],
  providers: [TokenCorrelationService],
  exports: [TokenCorrelationService],
})
export class TokenCorrelationModule {}

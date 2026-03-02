import { Module } from '@nestjs/common';
import { TokenCorrelationController } from './app.controller';
import { TokenCorrelationService } from './app.service';

@Module({
  imports: [],
  controllers: [TokenCorrelationController],
  providers: [TokenCorrelationService],
  exports: [TokenCorrelationService],
})
export class TokenCorrelationModule {}

import { Module } from '@nestjs/common';
import { TokenEconomicsController } from './token-economics.controller';
import { TokenEconomicsService } from './token-economics.service';

@Module({
  controllers: [TokenEconomicsController],
  providers: [TokenEconomicsService],
})
export class TokenEconomicsModule {}

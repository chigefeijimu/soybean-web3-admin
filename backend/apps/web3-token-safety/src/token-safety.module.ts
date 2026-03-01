import { Module } from '@nestjs/common';
import { TokenSafetyController } from './token-safety.controller';
import { TokenSafetyService } from './token-safety.service';

@Module({
  controllers: [TokenSafetyController],
  providers: [TokenSafetyService],
  exports: [TokenSafetyService],
})
export class TokenSafetyModule {}

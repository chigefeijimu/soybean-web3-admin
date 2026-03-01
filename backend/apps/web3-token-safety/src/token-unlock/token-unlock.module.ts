import { Module } from '@nestjs/common';
import { TokenUnlockController } from './token-unlock.controller';
import { TokenUnlockService } from './token-unlock.service';

@Module({
  controllers: [TokenUnlockController],
  providers: [TokenUnlockService],
  exports: [TokenUnlockService],
})
export class TokenUnlockModule {}

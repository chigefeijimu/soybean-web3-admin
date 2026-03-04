import { Module } from '@nestjs/common';
import { TokenUnlockController } from './token-unlock.controller';
import { TokenUnlockService } from './token-unlock.service';

@Module({
  imports: [],
  controllers: [TokenUnlockController],
  providers: [TokenUnlockService],
})
export class AppModule {}

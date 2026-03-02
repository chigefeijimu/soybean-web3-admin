import { Module } from '@nestjs/common';
import { TokenLockTrackerController } from './token-lock-tracker.controller';
import { TokenLockTrackerService } from './token-lock-tracker.service';

@Module({
  controllers: [TokenLockTrackerController],
  providers: [TokenLockTrackerService],
  exports: [TokenLockTrackerService],
})
export class TokenLockTrackerModule {}

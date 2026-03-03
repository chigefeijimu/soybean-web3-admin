import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TokenTransferTrackerController } from './token-transfer-tracker.controller';
import { TokenTransferTrackerService } from './token-transfer-tracker.service';

@Module({
  imports: [HttpModule],
  controllers: [TokenTransferTrackerController],
  providers: [TokenTransferTrackerService],
  exports: [TokenTransferTrackerService],
})
export class TokenTransferTrackerModule {}

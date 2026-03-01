import { Module } from '@nestjs/common';
import { WalletTrackerController } from './wallet-tracker.controller';
import { WalletTrackerService } from './wallet-tracker.service';

@Module({
  controllers: [WalletTrackerController],
  providers: [WalletTrackerService],
  exports: [WalletTrackerService],
})
export class WalletTrackerModule {}

import { Module } from '@nestjs/common';
import { WalletActivityController } from './wallet-activity.controller';
import { WalletActivityService } from './wallet-activity.service';

@Module({
  imports: [],
  controllers: [WalletActivityController],
  providers: [WalletActivityService],
})
export class WalletActivityModule {}

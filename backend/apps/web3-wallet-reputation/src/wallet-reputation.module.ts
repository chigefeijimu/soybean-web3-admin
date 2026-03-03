import { Module } from '@nestjs/common';
import { WalletReputationController } from './wallet-reputation.controller';
import { WalletReputationService } from './wallet-reputation.service';

@Module({
  controllers: [WalletReputationController],
  providers: [WalletReputationService],
  exports: [WalletReputationService],
})
export class WalletReputationModule {}

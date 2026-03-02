import { Module } from '@nestjs/common';
import { WalletGroupController } from './wallet-group.controller';
import { WalletGroupService } from './wallet-group.service';

@Module({
  controllers: [WalletGroupController],
  providers: [WalletGroupService],
  exports: [WalletGroupService],
})
export class WalletGroupModule {}

import { Module } from '@nestjs/common';
import { WalletMonitorController } from './wallet-monitor.controller';

@Module({
  controllers: [WalletMonitorController],
  providers: [],
  exports: [],
})
export class WalletMonitorModule {}

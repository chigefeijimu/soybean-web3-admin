import { Module } from '@nestjs/common';
import { DappBrowserController } from './dapp-browser.controller';
import { DappBrowserService } from './dapp-browser.service';

@Module({
  controllers: [DappBrowserController],
  providers: [DappBrowserService],
  exports: [DappBrowserService],
})
export class DappBrowserModule {}

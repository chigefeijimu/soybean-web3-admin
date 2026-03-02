import { Module } from '@nestjs/common';
import { Web3WhaleAlertController } from './web3-whale-alert.controller';
import { Web3WhaleAlertService } from './web3-whale-alert.service';

@Module({
  imports: [],
  controllers: [Web3WhaleAlertController],
  providers: [Web3WhaleAlertService],
  exports: [Web3WhaleAlertService],
})
export class Web3WhaleAlertModule {}

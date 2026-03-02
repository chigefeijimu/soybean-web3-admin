import { Module } from '@nestjs/common';
import { Web3GasAlertController } from './gas-alert.controller';
import { Web3GasService } from './web3-gas.service';

@Module({
  controllers: [Web3GasAlertController],
  providers: [Web3GasService],
  exports: [Web3GasService],
})
export class Web3GasAlertModule {}

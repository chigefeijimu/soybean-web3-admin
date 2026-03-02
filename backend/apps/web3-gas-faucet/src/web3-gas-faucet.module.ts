import { Module } from '@nestjs/common';
import { Web3GasFaucetController } from './web3-gas-faucet.controller';
import { Web3GasFaucetService } from './web3-gas-faucet.service';

@Module({
  imports: [],
  controllers: [Web3GasFaucetController],
  providers: [Web3GasFaucetService],
})
export class Web3GasFaucetModule {}

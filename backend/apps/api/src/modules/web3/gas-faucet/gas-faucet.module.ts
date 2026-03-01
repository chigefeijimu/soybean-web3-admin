import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GasFaucetController } from './gas-faucet.controller';
import { GasFaucetService } from './gas-faucet.service';

@Module({
  imports: [HttpModule],
  controllers: [GasFaucetController],
  providers: [GasFaucetService],
  exports: [GasFaucetService],
})
export class GasFaucetModule {}

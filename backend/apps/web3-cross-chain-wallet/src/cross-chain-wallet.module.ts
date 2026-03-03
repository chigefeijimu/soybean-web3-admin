import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrossChainWalletController } from './cross-chain-wallet.controller';
import { CrossChainWalletService } from './cross-chain-wallet.service';

@Module({
  imports: [HttpModule],
  controllers: [CrossChainWalletController],
  providers: [CrossChainWalletService],
  exports: [CrossChainWalletService],
})
export class CrossChainWalletModule {}

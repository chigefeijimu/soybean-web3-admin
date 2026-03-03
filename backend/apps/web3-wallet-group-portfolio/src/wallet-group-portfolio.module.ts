import { Module } from '@nestjs/common';
import { WalletGroupPortfolioController } from './wallet-group-portfolio.controller';
import { WalletGroupPortfolioService } from './wallet-group-portfolio.service';

@Module({
  controllers: [WalletGroupPortfolioController],
  providers: [WalletGroupPortfolioService],
  exports: [WalletGroupPortfolioService],
})
export class WalletGroupPortfolioModule {}

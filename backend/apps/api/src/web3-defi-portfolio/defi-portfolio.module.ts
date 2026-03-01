import { Module } from '@nestjs/common';
import { DefiPortfolioController } from './defi-portfolio.controller';
import { DefiPortfolioService } from './defi-portfolio.service';

@Module({
  controllers: [DefiPortfolioController],
  providers: [DefiPortfolioService],
  exports: [DefiPortfolioService],
})
export class DefiPortfolioModule {}

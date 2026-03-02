import { Module } from '@nestjs/common';
import { DefiStrategyPortfolioController } from './defi-strategy-portfolio.controller';
import { DefiStrategyPortfolioService } from './defi-strategy-portfolio.service';

@Module({
  controllers: [DefiStrategyPortfolioController],
  providers: [DefiStrategyPortfolioService],
  exports: [DefiStrategyPortfolioService],
})
export class DefiStrategyPortfolioModule {}

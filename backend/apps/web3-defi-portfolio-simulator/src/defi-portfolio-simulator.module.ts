import { Module } from '@nestjs/common';
import { DefiPortfolioSimulatorController } from './defi-portfolio-simulator.controller';
import { DefiPortfolioSimulatorService } from './defi-portfolio-simulator.service';

@Module({
  controllers: [DefiPortfolioSimulatorController],
  providers: [DefiPortfolioSimulatorService],
  exports: [DefiPortfolioSimulatorService],
})
export class DefiPortfolioSimulatorModule {}

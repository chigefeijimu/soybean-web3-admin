import { Module } from '@nestjs/common';
import { PortfolioStressTesterController } from './portfolio-stress-tester.controller';
import { PortfolioStressTesterService } from './portfolio-stress-tester.service';

@Module({
  controllers: [PortfolioStressTesterController],
  providers: [PortfolioStressTesterService],
  exports: [PortfolioStressTesterService],
})
export class PortfolioStressTesterModule {}

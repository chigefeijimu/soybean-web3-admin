import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PortfolioRebalancerController } from './portfolio-rebalancer.controller';
import { PortfolioRebalancerService } from './portfolio-rebalancer.service';

@Module({
  imports: [HttpModule],
  controllers: [PortfolioRebalancerController],
  providers: [PortfolioRebalancerService],
})
export class PortfolioRebalancerModule {}

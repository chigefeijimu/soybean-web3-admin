import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PortfolioHealthController } from './src/portfolio-health.controller';
import { PortfolioHealthService } from './src/portfolio-health.service';

@Module({
  imports: [HttpModule],
  controllers: [PortfolioHealthController],
  providers: [PortfolioHealthService],
  exports: [PortfolioHealthService]
})
export class PortfolioHealthModule {}

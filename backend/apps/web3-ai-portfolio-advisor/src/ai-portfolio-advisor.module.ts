import { Module } from '@nestjs/common';
import { AiPortfolioAdvisorController } from './ai-portfolio-advisor.controller';
import { AiPortfolioAdvisorService } from './ai-portfolio-advisor.service';

@Module({
  controllers: [AiPortfolioAdvisorController],
  providers: [AiPortfolioAdvisorService],
  exports: [AiPortfolioAdvisorService],
})
export class AiPortfolioAdvisorModule {}

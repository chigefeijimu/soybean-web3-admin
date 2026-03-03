import { Module } from '@nestjs/common';
import { AiPortfolioAdvisorModule } from './ai-portfolio-advisor.module';

@Module({
  imports: [AiPortfolioAdvisorModule],
})
export class AppModule {}

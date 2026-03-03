import { Module } from '@nestjs/common';
import { PortfolioInsightsModule } from './portfolio-insights.module';

@Module({
  imports: [PortfolioInsightsModule],
})
export class AppModule {}

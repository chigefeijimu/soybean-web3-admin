import { NestFactory } from '@nestjs/core';
import { PortfolioHealthDashboardModule } from './src/portfolio-health-dashboard.module';

async function bootstrap() {
  const app = await NestFactory.create(PortfolioHealthDashboardModule);
  app.setGlobalPrefix('api');
  await app.listen(3015);
  console.log('Portfolio Health Dashboard API running on port 3015');
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { PortfolioPerformanceModule } from './portfolio-performance.module';

async function bootstrap() {
  const app = await NestFactory.create(PortfolioPerformanceModule);
  await app.listen(3000);
  console.log('Portfolio Performance API running on port 3000');
}
bootstrap();

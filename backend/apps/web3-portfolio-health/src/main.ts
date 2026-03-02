import { NestFactory } from '@nestjs/core';
import { PortfolioHealthModule } from './src/portfolio-health.module';

async function bootstrap() {
  const app = await NestFactory.create(PortfolioHealthModule);
  await app.listen(3000);
  console.log('Portfolio Health API running on port 3000');
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './portfolio-rebalancer.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3002);
  console.log('Portfolio Rebalancer running on http://localhost:3002');
}
bootstrap();

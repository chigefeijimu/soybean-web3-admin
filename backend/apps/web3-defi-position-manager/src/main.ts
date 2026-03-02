import { NestFactory } from '@nestjs/core';
import { DefiPositionManagerModule } from './defi-position-manager.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(DefiPositionManagerModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3014;
  await app.listen(port);
  console.log(`🚀 DeFi Position Manager API running on http://localhost:${port}/api`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './pool-deep-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(3000);
  console.log('Pool Deep Analytics API running on http://localhost:3000/api');
}
bootstrap();

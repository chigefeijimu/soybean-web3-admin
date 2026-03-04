import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async  const app = function bootstrap() {
 await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(3000);
  console.log('🚀 Token Unlock Calendar API running on http://localhost:3000/api');
}
bootstrap();

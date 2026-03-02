import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/web3/token-momentum');
  app.enableCors();
  await app.listen(3002);
  console.log('Token Momentum Scanner API running on port 3002');
}
bootstrap();

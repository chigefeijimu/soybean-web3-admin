import { NestFactory } from '@nestjs/core';
import { Web3WhaleAlertModule } from './src/web3-whale-alert.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(Web3WhaleAlertModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.setGlobalPrefix('api/web3/whale-alert');
  
  await app.listen(3002);
  console.log('🦈 Whale Alert Service running on http://localhost:3002');
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './wallet-behavior-pattern.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  const port = process.env.PORT || 3017;
  await app.listen(port);
  console.log(`🚀 Wallet Behavior Pattern API running on port ${port}`);
}

bootstrap();

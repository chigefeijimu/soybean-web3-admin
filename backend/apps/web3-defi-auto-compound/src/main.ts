import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AutoCompoundModule } from './auto-compound.module';

async function bootstrap() {
  const app = await NestFactory.create(AutoCompoundModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.setGlobalPrefix('api/web3/auto-compound');
  
  const port = process.env.PORT || 3018;
  await app.listen(port);
  console.log(`DeFi Auto-Compound API running on port ${port}`);
}
bootstrap();

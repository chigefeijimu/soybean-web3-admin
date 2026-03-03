import { NestFactory } from '@nestjs/core';
import { AppModule } from './mev-blocker.module';
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
  
  app.setGlobalPrefix('api/v1/mev-blocker');
  
  const port = process.env.PORT || 3015;
  await app.listen(port);
  console.log(`MEV Blocker API is running on port ${port}`);
}

bootstrap();

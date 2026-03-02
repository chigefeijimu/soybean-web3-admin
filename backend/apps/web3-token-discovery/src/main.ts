import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.setGlobalPrefix('api/token-discovery');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  await app.listen(3008);
  console.log('Token Discovery service running on port 3008');
}
bootstrap();

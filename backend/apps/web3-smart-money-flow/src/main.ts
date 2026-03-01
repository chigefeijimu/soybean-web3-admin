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
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));
  
  app.setGlobalPrefix('api/smart-money');
  
  await app.listen(3006);
  console.log('Smart Money Flow API running on port 3006');
}
bootstrap();

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
  
  app.setGlobalPrefix('api/portfolio-insights');
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  const port = process.env.PORT || 3014;
  await app.listen(port);
  console.log(`🚀 Portfolio Insights API running on http://localhost:${port}`);
}

bootstrap();

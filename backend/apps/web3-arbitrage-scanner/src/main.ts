import { NestFactory } from '@nestjs/core';
import { ArbitrageModule } from './arbitrage.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '@app/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(ArbitrageModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.useGlobalFilters(new HttpExceptionFilter());
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const port = process.env.ARBITRAGE_PORT || 3008;
  await app.listen(port);
  console.log(`Arbitrage Scanner API running on port ${port}`);
}
bootstrap();

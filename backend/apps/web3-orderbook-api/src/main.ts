import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { OrderbookModule } from './orderbook.module';

async function bootstrap() {
  const app = await NestFactory.create(OrderbookModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Orderbook API')
    .setDescription('Real-time Order Book & Market Depth API for DEX trading pairs')
    .setVersion('1.0')
    .addTag('Orderbook')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/orderbook', app, document);

  const port = process.env.PORT || 3018;
  await app.listen(port);
  console.log(`📊 Orderbook API running on port ${port}`);
}

bootstrap();

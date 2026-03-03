import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Web3DefiUserAnalyticsModule } from './web3-defi-user-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(Web3DefiUserAnalyticsModule);

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
    .setTitle('DeFi User Analytics API')
    .setDescription('API for tracking and analyzing user metrics for DeFi protocols')
    .setVersion('1.0')
    .addTag('DeFi User Analytics')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3047;
  await app.listen(port);
  console.log(`DeFi User Analytics API is running on port ${port}`);
}

bootstrap();

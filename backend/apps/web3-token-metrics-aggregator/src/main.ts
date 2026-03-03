import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TokenMetricsAggregatorModule } from './src/token-metrics-aggregator.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenMetricsAggregatorModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  const config = new DocumentBuilder()
    .setTitle('Cross-chain Token Metrics Aggregator')
    .setDescription('API for aggregating token metrics across multiple blockchain chains')
    .setVersion('1.0')
    .addTag('token-metrics')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/web3-token-metrics', app, document);
  
  await app.listen(3000);
  console.log('Token Metrics Aggregator running on port 3000');
}

bootstrap();

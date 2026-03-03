import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Cross-chain Transaction Fee Predictor API')
    .setDescription('AI-driven fee prediction and optimal transaction timing service')
    .setVersion('1.0')
    .addTag('fee-predictor')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/web3-tx-fee-predictor', app, document);

  const port = process.env.PORT || 3052;
  await app.listen(port);
  console.log(`🚀 Web3 Transaction Fee Predictor running on port ${port}`);
}

bootstrap();

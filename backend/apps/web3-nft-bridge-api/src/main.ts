import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AppModule } from './web3-nft-bridge-api.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Cross-chain NFT Bridge API')
    .setDescription('API for tracking and comparing cross-chain NFT bridges')
    .setVersion('1.0')
    .addTag('NFT Bridge')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3038;
  await app.listen(port);
  console.log(`NFT Bridge API is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();

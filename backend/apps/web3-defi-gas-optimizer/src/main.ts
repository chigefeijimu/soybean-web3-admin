import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

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
    .setTitle('DeFi Gas Optimizer API')
    .setDescription('Smart DeFi gas strategy recommendation service')
    .setVersion('1.0')
    .addTag('defi-gas-optimizer')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/web3-defi-gas-optimizer', app, document);

  await app.listen(3000);
  console.log('DeFi Gas Optimizer running on port 3000');
}

bootstrap();

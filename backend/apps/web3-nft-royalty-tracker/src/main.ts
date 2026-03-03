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
  
  app.setGlobalPrefix('api/web3/nft-royalty');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Cross-chain NFT Royalty Tracker API')
    .setDescription('Track NFT series royalty income across multiple chains')
    .setVersion('1.0')
    .addTag('royalty')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/nft-royalty', app, document);

  const port = process.env.NFT_ROYALTY_PORT || 3020;
  await app.listen(port);
  console.log(`🌐 NFT Royalty Tracker running on port ${port}`);
}
bootstrap();

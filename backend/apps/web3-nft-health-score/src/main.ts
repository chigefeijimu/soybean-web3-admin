import { NestFactory } from '@nestjs/core';
import { NftHealthScoreModule } from './nft-health-score.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(NftHealthScoreModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`NFT Health Score API is running on port ${port}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /api/nft-health-score/health?contractAddress=...&chain=...`);
  console.log(`  POST /api/nft-health-score/batch`);
  console.log(`  GET  /api/nft-health-score/stats`);
}

bootstrap();

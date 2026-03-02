import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { CrossChainTxTrackerModule } from './cross-chain-tx-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    CrossChainTxTrackerModule,
    new FastifyAdapter(),
  );
  
  app.setGlobalPrefix('api/cross-chain');
  app.enableCors();
  
  const port = process.env.PORT || 3005;
  await app.listen(port, '0.0.0.0');
  console.log(`Cross-Chain Tx Tracker API running on port ${port}`);
}

bootstrap();

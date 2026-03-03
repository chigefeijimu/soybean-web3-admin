import { NestFactory } from '@nestjs/core';
import { AppModule } from './cross-chain-rebalancer.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CrossChainRebalancer');
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/cross-chain-rebalancer');
  
  const port = process.env.PORT || 3018;
  await app.listen(port);
  logger.log(`Cross-chain Rebalancer API running on port ${port}`);
}

bootstrap();

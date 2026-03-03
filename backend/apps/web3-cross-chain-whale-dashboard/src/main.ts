import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('CrossChainWhaleDashboard');
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3008;
  await app.listen(port);
  logger.log(`Cross-chain Whale Dashboard API running on port ${port}`);
}

bootstrap();

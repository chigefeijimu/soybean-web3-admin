import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('StakingRewardsTracker');
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3032;
  await app.listen(port);
  logger.log(`🚀 Staking Rewards Tracker API running on port ${port}`);
}

bootstrap();

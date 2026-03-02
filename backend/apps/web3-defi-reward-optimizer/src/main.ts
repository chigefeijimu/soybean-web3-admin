import { NestFactory } from '@nestjs/core';
import { DefiRewardOptimizerModule } from './defi-reward-optimizer.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiRewardOptimizerModule);
  app.enableCors();
  await app.listen(3000);
  console.log('DeFi Reward Optimizer API running on port 3000');
}
bootstrap();

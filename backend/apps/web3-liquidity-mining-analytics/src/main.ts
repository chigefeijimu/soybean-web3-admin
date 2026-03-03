import { NestFactory } from '@nestjs/core';
import { LiquidityMiningAnalyticsModule } from './liquidity-mining-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(LiquidityMiningAnalyticsModule);
  await app.listen(3000);
  console.log('⛏️ Liquidity Mining Analytics service is running on http://localhost:3000');
}
bootstrap();

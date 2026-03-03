import { NestFactory } from '@nestjs/core';
import { LiquidityRebalancerModule } from './liquidity-rebalancer.module';

async function bootstrap() {
  const app = await NestFactory.create(LiquidityRebalancerModule);
  await app.listen(3000);
  console.log('🔄 Liquidity Rebalancer service is running on http://localhost:3000');
}
bootstrap();

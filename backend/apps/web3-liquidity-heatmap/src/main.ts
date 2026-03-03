import { NestFactory } from '@nestjs/core';
import { LiquidityHeatmapModule } from './liquidity-heatmap.module';

async function bootstrap() {
  const app = await NestFactory.create(LiquidityHeatmapModule);
  await app.listen(3000);
  console.log('Liquidity Heatmap API is running on port 3000');
}
bootstrap();

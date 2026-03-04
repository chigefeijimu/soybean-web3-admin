import { NestFactory } from '@nestjs/core';
import { DefiProtocolMetricsModule } from './defi-protocol-metrics.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiProtocolMetricsModule);
  app.enableCors();
  await app.listen(3000);
  console.log('DeFi Protocol Metrics API running on http://localhost:3000');
}
bootstrap();

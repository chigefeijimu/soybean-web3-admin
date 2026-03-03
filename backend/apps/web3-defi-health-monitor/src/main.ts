import { NestFactory } from '@nestjs/core';
import { Web3DefiHealthMonitorModule } from './web3-defi-health-monitor.module';

async function bootstrap() {
  const app = await NestFactory.create(Web3DefiHealthMonitorModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
  console.log('Web3 DeFi Health Monitor API running on http://localhost:3000/api');
}
bootstrap();

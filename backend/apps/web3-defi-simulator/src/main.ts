import { NestFactory } from '@nestjs/core';
import { DefiSimulatorModule } from './defi-simulator.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiSimulatorModule);
  app.setGlobalPrefix('api');
  await app.listen(3002);
  console.log('DeFi Simulator running on http://localhost:3002/api');
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { DefiGasEstimatorModule } from './defi-gas-estimator.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiGasEstimatorModule);
  app.enableCors();
  await app.listen(3000);
  console.log('DeFi Gas Estimator API running on port 3000');
}
bootstrap();

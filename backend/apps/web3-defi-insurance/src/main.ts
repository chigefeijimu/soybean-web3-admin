import { NestFactory } from '@nestjs/core';
import { DefiInsuranceModule } from './defi-insurance.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiInsuranceModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
  console.log('DeFi Insurance service running on http://localhost:3000');
}
bootstrap();

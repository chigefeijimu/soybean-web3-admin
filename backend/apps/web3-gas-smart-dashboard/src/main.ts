import { NestFactory } from '@nestjs/core';
import { GasSmartDashboardModule } from './gas-smart-dashboard.module';

async function bootstrap() {
  const app = await NestFactory.create(GasSmartDashboardModule);
  await app.listen(3000);
  console.log('Gas Smart Dashboard API is running on: http://localhost:3000');
}
bootstrap();

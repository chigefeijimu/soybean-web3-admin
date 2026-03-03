import { NestFactory } from '@nestjs/core';
import { DefiCollateralTrackerModule } from './defi-collateral-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiCollateralTrackerModule);
  await app.listen(3000);
  console.log('Defi Collateral Tracker is running on port 3000');
}
bootstrap();

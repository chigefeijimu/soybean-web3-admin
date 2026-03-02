import { NestFactory } from '@nestjs/core';
import { GasBudgetPlannerModule } from './gas-budget-planner.module';

async function bootstrap() {
  const app = await NestFactory.create(GasBudgetPlannerModule);
  await app.listen(3000);
}
bootstrap();

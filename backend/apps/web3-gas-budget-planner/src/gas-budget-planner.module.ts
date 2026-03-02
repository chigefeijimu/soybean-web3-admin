import { Module } from '@nestjs/common';
import { GasBudgetPlannerController } from './gas-budget-planner.controller';
import { GasBudgetPlannerService } from './gas-budget-planner.service';

@Module({
  imports: [],
  controllers: [GasBudgetPlannerController],
  providers: [GasBudgetPlannerService],
})
export class GasBudgetPlannerModule {}

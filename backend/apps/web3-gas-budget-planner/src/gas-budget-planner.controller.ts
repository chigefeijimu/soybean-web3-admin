import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { GasBudgetPlannerService } from './gas-budget-planner.service';

@Controller('gas-budget')
export class GasBudgetPlannerController {
  constructor(private readonly gasBudgetPlannerService: GasBudgetPlannerService) {}

  @Get('chains')
  async getSupportedChains() {
    return this.gasBudgetPlannerService.getSupportedChains();
  }

  @Get('transaction-types')
  async getTransactionTypes() {
    return this.gasBudgetPlannerService.getTransactionTypes();
  }

  @Post('calculate')
  async calculateBudget(
    @Body() params: {
      chainId: number;
      transactionType: string;
      gasPrice?: number;
      count?: number;
    },
  ) {
    return this.gasBudgetPlannerService.calculateBudget(params);
  }

  @Post('projection')
  async getBudgetProjection(
    @Body() params: {
      chainId: number;
      transactions: Array<{
        type: string;
        count: number;
        date?: string;
      }>;
      days?: number;
    },
  ) {
    return this.gasBudgetPlannerService.getBudgetProjection(params);
  }

  @Post('breakdown')
  async getBudgetBreakdown(
    @Body() params: {
      chainId: number;
      transactions: Array<{
        name: string;
        type: string;
        count: number;
      }>;
    },
  ) {
    return this.gasBudgetPlannerService.getBudgetBreakdown(params);
  }

  @Get('compare-chains')
  async compareChains(
    @Query('transactionType') transactionType: string,
    @Query('count') count?: string,
  ) {
    return this.gasBudgetPlannerService.compareChains({
      transactionType,
      count: count ? parseInt(count, 10) : 1,
    });
  }

  @Get('saving-tips')
  async getGasSavingTips() {
    return this.gasBudgetPlannerService.getGasSavingTips();
  }

  @Post('monthly-budget')
  async calculateMonthlyBudget(
    @Body() params: {
      chainId: number;
      monthlyTransactions: Array<{
        type: string;
        countPerMonth: number;
      }>;
    },
  ) {
    return this.gasBudgetPlannerService.calculateMonthlyBudget(params);
  }
}

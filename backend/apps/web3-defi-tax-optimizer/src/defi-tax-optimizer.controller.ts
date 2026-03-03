import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DefiTaxOptimizerService } from './defi-tax-optimizer.service';

@Controller('defi-tax-optimizer')
export class DefiTaxOptimizerController {
  constructor(private readonly service: DefiTaxOptimizerService) {}

  @Get('analyze/:address')
  async analyzeDefiTax(
    @Param('address') address: string,
    @Query('chains') chains?: string,
    @Query('taxYear') taxYear?: number,
  ) {
    return this.service.analyzeDefiTaxPosition(address, chains, taxYear);
  }

  @Get('optimization/:address')
  async getTaxOptimization(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    return this.service.getTaxOptimization Opportunities(address, chains);
  }

  @Post('harvest-opportunities')
  async findHarvestOpportunities(
    @Body() body: { addresses: string[]; chains?: string[] },
  ) {
    return this.service.findTaxLossHarvestingOpportunities(body.addresses, body.chains);
  }

  @Get('defi-transactions/:address')
  async getDefiTransactions(
    @Param('address') address: string,
    @Query('chains') chains?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getDefiTransactions(address, chains, startDate, endDate);
  }

  @Get('tax-liability/:address')
  async calculateTaxLiability(
    @Param('address') address: string,
    @Query('taxRate') taxRate?: number,
    @Query('taxYear') taxYear?: number,
  ) {
    return this.service.calculateTaxLiability(address, taxRate, taxYear);
  }

  @Get('dashboard')
  async getDashboard() {
    return this.service.getDashboardStats();
  }
}

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TaxCalculatorService, TaxTransaction, TaxSummary, TaxReport, CostBasisMethod } from './tax-calculator.service';

@Controller('web3/tax-calculator')
export class TaxCalculatorController {
  constructor(private readonly taxCalculatorService: TaxCalculatorService) {}

  /**
   * Get tax summary for a wallet address
   */
  @Get('summary/:address')
  async getTaxSummary(
    @Param('address') address: string,
    @Query('year') year?: string,
    @Query('method') method?: CostBasisMethod
  ): Promise<TaxSummary> {
    const taxYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const costMethod = method || 'FIFO';
    return this.taxCalculatorService.getTaxSummary(address, taxYear, costMethod);
  }

  /**
   * Calculate taxes for multiple transactions
   */
  @Post('calculate')
  async calculateTaxes(
    @Body() body: { transactions: TaxTransaction[]; method: CostBasisMethod; taxYear: number }
  ): Promise<TaxReport> {
    return this.taxCalculatorService.calculateTaxReport(
      body.transactions,
      body.method,
      body.taxYear
    );
  }

  /**
   * Get transactions from blockchain for a wallet
   */
  @Get('transactions/:address')
  async getTransactions(
    @Param('address') address: string,
    @Query('limit') limit?: string
  ): Promise<TaxTransaction[]> {
    const numLimit = limit ? parseInt(limit, 10) : 100;
    return this.taxCalculatorService.getTransactionsFromChain(address, numLimit);
  }

  /**
   * Get detailed gains/losses for each transaction
   */
  @Get('gains/:address')
  async getGainsLosses(
    @Param('address') address: string,
    @Query('year') year?: string,
    @Query('method') method?: CostBasisMethod
  ): Promise<{ transactions: TaxTransaction[]; totalGains: number; totalLosses: number }> {
    const taxYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const costMethod = method || 'FIFO';
    return this.taxCalculatorService.getGainsLosses(address, taxYear, costMethod);
  }

  /**
   * Get tax rates by jurisdiction
   */
  @Get('rates')
  async getTaxRates(): Promise<{ jurisdiction: string; shortTermRate: number; longTermRate: number }[]> {
    return this.taxCalculatorService.getTaxRates();
  }

  /**
   * Export tax report as CSV
   */
  @Get('export/:address')
  async exportTaxReport(
    @Param('address') address: string,
    @Query('year') year?: string,
    @Query('method') method?: CostBasisMethod
  ): Promise<{ csv: string; filename: string }> {
    const taxYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const costMethod = method || 'FIFO';
    return this.taxCalculatorService.exportTaxReportCSV(address, taxYear, costMethod);
  }

  /**
   * Get supported cost basis methods
   */
  @Get('methods')
  async getCostBasisMethods(): Promise<string[]> {
    return this.taxCalculatorService.getCostBasisMethods();
  }

  /**
   * Calculate wash sale adjustments
   */
  @Get('wash-sale/:address')
  async getWashSales(
    @Param('address') address: string,
    @Query('year') year?: string
  ): Promise<{ disallowedLosses: number; affectedTransactions: number }> {
    const taxYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.taxCalculatorService.calculateWashSales(address, taxYear);
  }
}

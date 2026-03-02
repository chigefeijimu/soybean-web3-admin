import { Controller, Get, Post, Query, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TaxReportService } from './tax-report.service';

@ApiTags('Web3 Tax Report')
@Controller('web3/tax-report')
export class TaxReportController {
  constructor(private readonly taxReportService: TaxReportService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate tax report for a wallet address' })
  async generateReport(
    @Query('address') address: string,
    @Query('year') year: number,
    @Query('chainId') chainId: number = 1,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    
    const reportYear = year || new Date().getFullYear() - 1;
    
    try {
      const report = await this.taxReportService.generateTaxReport(
        address,
        reportYear,
        chainId,
      );
      return report;
    } catch (error) {
      console.error('Error generating tax report:', error);
      return { error: 'Failed to generate tax report', details: error.message };
    }
  }

  @Get('export-csv')
  @ApiOperation({ summary: 'Export tax report as CSV' })
  async exportCSV(
    @Query('address') address: string,
    @Query('year') year: number,
    @Query('chainId') chainId: number = 1,
    @Res() res?: Response,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    
    const reportYear = year || new Date().getFullYear() - 1;
    
    try {
      const report = await this.taxReportService.generateTaxReport(
        address,
        reportYear,
        chainId,
      );
      
      const csv = await this.taxReportService.exportToCSV(report);
      
      if (res) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="tax-report-${address.slice(0, 8)}-${reportYear}.csv"`,
        );
        res.status(HttpStatus.OK).send(csv);
      }
      
      return { csv };
    } catch (error) {
      console.error('Error exporting CSV:', error);
      return { error: 'Failed to export CSV', details: error.message };
    }
  }

  @Get('chains')
  @ApiOperation({ summary: 'Get supported chains for tax reporting' })
  async getSupportedChains() {
    return this.taxReportService.getSupportedChains();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get quick tax summary for a wallet' })
  async getQuickSummary(
    @Query('address') address: string,
    @Query('year') year: number,
    @Query('chainId') chainId: number = 1,
  ) {
    if (!address) {
      return { error: 'Address is required' };
    }
    
    const reportYear = year || new Date().getFullYear() - 1;
    
    try {
      const report = await this.taxReportService.generateTaxReport(
        address,
        reportYear,
        chainId,
      );
      
      return {
        address: report.address,
        year: report.year,
        totalTransactions: report.totalTransactions,
        netCapitalGain: report.summary.netCapitalGain,
        totalIncome: report.summary.totalIncome,
        totalGasFees: report.summary.totalGasFees,
        estimatedTax: report.summary.estimatedTax,
        realizedGainsCount: report.realizedGains.length,
        unrealizedGainsCount: report.unrealizedGains.length,
        incomeEventsCount: report.incomeEvents.length,
      };
    } catch (error) {
      console.error('Error getting summary:', error);
      return { error: 'Failed to get summary', details: error.message };
    }
  }
}

import { Controller, Get, Post, Query, Param, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { PortfolioExportService } from './portfolio-export.service';

@ApiTags('Portfolio Export')
@Controller('portfolio-export')
export class PortfolioExportController {
  constructor(private readonly portfolioExportService: PortfolioExportService) {}

  @Get('portfolio/:address')
  @ApiOperation({ summary: 'Get portfolio data for export' })
  @ApiQuery({ name: 'chains', required: false, description: 'Comma-separated chain IDs' })
  async getPortfolioData(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains ? chains.split(',') : ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche', 'base'];
    return this.portfolioExportService.getPortfolioData(address, chainList);
  }

  @Post('export/csv')
  @ApiOperation({ summary: 'Export portfolio as CSV' })
  async exportCsv(
    @Body() body: { address: string; chains?: string[] },
    @Res() res: Response,
  ) {
    const chains = body.chains || ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche', 'base'];
    const data = await this.portfolioExportService.getPortfolioData(body.address, chains);
    const csv = await this.portfolioExportService.generateCsv(data);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="portfolio-${body.address}.csv"`);
    res.send(csv);
  }

  @Post('export/pdf')
  @ApiOperation({ summary: 'Export portfolio as PDF' })
  async exportPdf(
    @Body() body: { address: string; chains?: string[] },
    @Res() res: Response,
  ) {
    const chains = body.chains || ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche', 'base'];
    const data = await this.portfolioExportService.getPortfolioData(body.address, chains);
    const pdfBuffer = await this.portfolioExportService.generatePdf(data);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="portfolio-${body.address}.pdf"`);
    res.send(pdfBuffer);
  }

  @Get('supported-chains')
  @ApiOperation({ summary: 'Get supported chains for portfolio export' })
  async getSupportedChains() {
    return this.portfolioExportService.getSupportedChains();
  }

  @Get('export-summary/:address')
  @ApiOperation({ summary: 'Get portfolio export summary' })
  async getExportSummary(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains ? chains.split(',') : ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche', 'base'];
    return this.portfolioExportService.getExportSummary(address, chainList);
  }
}

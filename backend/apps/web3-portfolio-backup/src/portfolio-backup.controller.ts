import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PortfolioBackupService, ExportRequest, ImportRequest } from './portfolio-backup.service';

@Controller('api/portfolio-backup')
export class PortfolioBackupController {
  constructor(private readonly backupService: PortfolioBackupService) {}

  // Get export types
  @Get('export-types')
  getExportTypes() {
    return {
      success: true,
      data: this.backupService.getExportTypes(),
    };
  }

  // Export portfolio data
  @Post('export')
  async exportPortfolio(@Body() request: ExportRequest) {
    const result = await this.backupService.exportPortfolio(request);
    return {
      success: true,
      data: result,
    };
  }

  // Export and download as JSON file
  @Post('export/download')
  async exportAndDownload(
    @Body() request: ExportRequest,
    @Res() res: Response,
  ) {
    const result = await this.backupService.exportPortfolio(request);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="portfolio-backup-${Date.now()}.json"`);
    res.send(JSON.stringify(result, null, 2));
  }

  // Import portfolio data
  @Post('import')
  async importPortfolio(@Body() request: ImportRequest) {
    const result = await this.backupService.importPortfolio(request);
    return {
      success: result.success,
      data: result,
    };
  }

  // Validate backup data
  @Post('validate')
  async validateBackup(@Body() body: { data: any }) {
    const result = await this.backupService.validateBackup(body.data);
    return {
      success: result.valid,
      data: result,
    };
  }

  // Get backup history
  @Get('history')
  async getBackupHistory(@Query('userId') userId?: string) {
    const result = await this.backupService.getBackupHistory(userId);
    return {
      success: true,
      data: result,
    };
  }

  // Get statistics
  @Get('statistics')
  async getStatistics() {
    const result = await this.backupService.getStatistics();
    return {
      success: true,
      data: result,
    };
  }

  // Get sample backup
  @Get('sample')
  async getSampleBackup(@Query('type') type?: string) {
    const result = this.backupService.generateSampleBackup(type as any);
    return {
      success: true,
      data: result,
    };
  }

  // Health check
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'Portfolio Backup API',
      timestamp: Date.now(),
    };
  }
}

import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TxFailureAnalyzerService } from './tx-failure-analyzer.service';

interface AnalyzeTxDto {
  txHash: string;
  chainId?: number;
}

interface GetFailureHistoryDto {
  address: string;
  chainId?: number;
  limit?: number;
}

interface DiagnoseFailureDto {
  txHash: string;
  chainId?: number;
}

@Controller('tx-failure-analyzer')
export class TxFailureAnalyzerController {
  constructor(private readonly txFailureAnalyzerService: TxFailureAnalyzerService) {}

  @Get('health')
  async getHealth() {
    return this.txFailureAnalyzerService.getHealth();
  }

  @Post('analyze')
  async analyzeTransaction(@Body() dto: AnalyzeTxDto) {
    return this.txFailureAnalyzerService.analyzeTransaction(dto.txHash, dto.chainId || 1);
  }

  @Get('history/:address')
  async getFailureHistory(
    @Param('address') address: string,
    @Query('chainId') chainId?: string,
    @Query('limit') limit?: string,
  ) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.txFailureAnalyzerService.getFailureHistory(address, chainIdNum, limitNum);
  }

  @Post('diagnose')
  async diagnoseFailure(@Body() dto: DiagnoseFailureDto) {
    return this.txFailureAnalyzerService.diagnoseFailure(dto.txHash, dto.chainId || 1);
  }

  @Get('common-failures')
  async getCommonFailures(@Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.txFailureAnalyzerService.getCommonFailures(chainIdNum);
  }

  @Get('failure-stats/:address')
  async getFailureStats(@Param('address') address: string, @Query('chainId') chainId?: string) {
    const chainIdNum = chainId ? parseInt(chainId, 10) : 1;
    return this.txFailureAnalyzerService.getFailureStats(address, chainIdNum);
  }

  @Post('suggest-fix')
  async suggestFix(@Body() dto: { txHash: string; chainId?: number; failureReason: string }) {
    return this.txFailureAnalyzerService.suggestFix(dto.txHash, dto.chainId || 1, dto.failureReason);
  }

  @Get('chains')
  async getSupportedChains() {
    return this.txFailureAnalyzerService.getSupportedChains();
  }
}

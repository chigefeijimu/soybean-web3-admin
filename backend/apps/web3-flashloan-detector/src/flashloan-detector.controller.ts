import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { FlashloanDetectorService, FlashloanAnalysisResult } from './flashloan-detector.service';
import { IsString, IsNumber } from 'class-validator';

class AnalyzeTokenDto {
  @IsString()
  address: string;

  @IsNumber()
  chainId: number;
}

@Controller('web3/flashloan-detector')
export class FlashloanDetectorController {
  constructor(private readonly flashloanDetectorService: FlashloanDetectorService) {}

  @Get('analyze/:chainId/:address')
  async analyzeToken(
    @Param('chainId') chainId: number,
    @Param('address') address: string,
  ): Promise<FlashloanAnalysisResult> {
    return this.flashloanDetectorService.analyzeFlashloanRisk(chainId, address);
  }

  @Post('analyze')
  async analyzeTokenPost(@Body() dto: AnalyzeTokenDto): Promise<FlashloanAnalysisResult> {
    return this.flashloanDetectorService.analyzeFlashloanRisk(dto.chainId, dto.address);
  }

  @Get('recent-attacks')
  async getRecentAttacks(
    @Query('chainId') chainId?: number,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.flashloanDetectorService.getRecentFlashloanAttacks(chainId, limit);
  }

  @Get('vulnerable-tokens')
  async getVulnerableTokens(
    @Query('chainId') chainId?: number,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    return this.flashloanDetectorService.getPotentiallyVulnerableTokens(chainId, limit);
  }

  @Get('health')
  async health(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

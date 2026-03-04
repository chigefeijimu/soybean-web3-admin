import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { DcaBotService, DcaStrategy, DcaPosition, DcaOpportunity, DcaStatistics, CreateStrategyDto } from './dca-bot.service';

@Controller('dca-bot')
export class DcaBotController {
  constructor(private readonly dcaBotService: DcaBotService) {}

  @Get('strategies/:address')
  async getStrategies(
    @Param('address') address: string,
  ): Promise<{ strategies: DcaStrategy[] }> {
    return this.dcaBotService.getStrategies(address.toLowerCase());
  }

  @Post('strategy')
  async createStrategy(
    @Body() body: CreateStrategyDto,
  ): Promise<DcaStrategy> {
    return this.dcaBotService.createStrategy(body);
  }

  @Post('strategy/:id/pause')
  async pauseStrategy(
    @Param('id') id: string,
  ): Promise<{ success: boolean; strategy: DcaStrategy }> {
    return this.dcaBotService.pauseStrategy(id);
  }

  @Post('strategy/:id/resume')
  async resumeStrategy(
    @Param('id') id: string,
  ): Promise<{ success: boolean; strategy: DcaStrategy }> {
    return this.dcaBotService.resumeStrategy(id);
  }

  @Delete('strategy/:id')
  async deleteStrategy(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.dcaBotService.deleteStrategy(id);
  }

  @Get('positions/:address')
  async getPositions(
    @Param('address') address: string,
  ): Promise<{ positions: DcaPosition[] }> {
    return this.dcaBotService.getPositions(address.toLowerCase());
  }

  @Get('position/:id')
  async getPosition(
    @Param('id') id: string,
  ): Promise<DcaPosition> {
    return this.dcaBotService.getPosition(id);
  }

  @Get('opportunities')
  async getOpportunities(
    @Query('chain') chain?: string,
    @Query('limit') limit?: string,
  ): Promise<{ opportunities: DcaOpportunity[] }> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.dcaBotService.getOpportunities(chain, limitNum);
  }

  @Post('opportunity/analyze')
  async analyzeOpportunity(
    @Body() body: { fromToken: string; toToken: string; chain: string },
  ): Promise<{
    opportunity: DcaOpportunity;
    historicalPerformance: {
      avgPurchasePrice: number;
      currentPrice: number;
      priceChange: number;
      volatility: number;
    };
    projections: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  }> {
    return this.dcaBotService.analyzeOpportunity(body.fromToken, body.toToken, body.chain);
  }

  @Get('statistics/:address')
  async getStatistics(
    @Param('address') address: string,
  ): Promise<DcaStatistics> {
    return this.dcaBotService.getStatistics(address.toLowerCase());
  }

  @Get('supported-chains')
  async getSupportedChains(): Promise<string[]> {
    return this.dcaBotService.getSupportedChains();
  }

  @Get('supported-tokens')
  async getSupportedTokens(
    @Query('chain') chain?: string,
  ): Promise<Record<string, string[]>> {
    return this.dcaBotService.getSupportedTokens(chain);
  }

  @Get('calculate')
  async calculateDca(
    @Query('amount') amount: string,
    @Query('frequency') frequency: string,
    @Query('token') token: string,
    @Query('duration') duration: string,
  ): Promise<{
    totalInvested: number;
    estimatedTokens: number;
    averagePrice: number;
    projection: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  }> {
    return this.dcaBotService.calculateDca(
      parseFloat(amount),
      frequency,
      token,
      parseInt(duration, 10),
    );
  }
}

import { Delete } from '@nestjs/common';

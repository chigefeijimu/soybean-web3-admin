import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DefiStrategyBuilderService, Strategy, StrategyBacktestResult } from './defi-strategy-builder.service';

@Controller('web3/defi-strategy-builder')
export class DefiStrategyBuilderController {
  constructor(private readonly service: DefiStrategyBuilderService) {}

  @Get('strategies')
  async getAllStrategies(): Promise<Strategy[]> {
    return this.service.getAllStrategies();
  }

  @Get('strategies/:id')
  async getStrategyById(@Param('id') id: string): Promise<Strategy | null> {
    return this.service.getStrategyById(id);
  }

  @Post('strategies')
  async createStrategy(
    @Body() data: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Strategy> {
    return this.service.createStrategy(data);
  }

  @Put('strategies/:id')
  async updateStrategy(
    @Param('id') id: string,
    @Body() data: Partial<Strategy>,
  ): Promise<Strategy | null> {
    return this.service.updateStrategy(id, data);
  }

  @Delete('strategies/:id')
  async deleteStrategy(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.service.deleteStrategy(id);
    return { success };
  }

  @Post('strategies/:id/backtest')
  async runBacktest(
    @Param('id') id: string,
    @Body() body: { period: '7d' | '30d' | '90d' | '1y' },
  ): Promise<StrategyBacktestResult> {
    return this.service.runBacktest(id, body.period);
  }

  @Get('strategies/:id/backtest')
  async getBacktestHistory(@Param('id') id: string): Promise<StrategyBacktestResult[]> {
    return this.service.getBacktestHistory(id);
  }

  @Get('strategies/:id/risk')
  async analyzeRisk(@Param('id') id: string): Promise<any> {
    return this.service.analyzeStrategyRisk(id);
  }

  @Get('templates')
  async getTemplates(): Promise<any[]> {
    return this.service.getStrategyTemplates();
  }

  @Get('chains')
  async getChains(): Promise<string[]> {
    return this.service.getAvailableChains();
  }

  @Get('protocols')
  async getProtocols(@Query('chain') chain?: string): Promise<any[]> {
    return this.service.getAvailableProtocols(chain);
  }
}

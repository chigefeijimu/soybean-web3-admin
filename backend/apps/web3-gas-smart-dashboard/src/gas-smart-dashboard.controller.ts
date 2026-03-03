import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { GasSmartDashboardService } from './gas-smart-dashboard.service';

@Controller('gas-smart-dashboard')
export class GasSmartDashboardController {
  constructor(private readonly gasService: GasSmartDashboardService) {}

  @Get('chains')
  async getAllChainsGas() {
    return this.gasService.getAllChainsGas();
  }

  @Get('chains/:chain')
  async getChainGas(@Param('chain') chain: string) {
    const chainId = this.getChainId(chain);
    return this.gasService.getChainGasData(chain, chainId);
  }

  @Get('comparison')
  async getGasComparison() {
    return this.gasService.getGasComparison();
  }

  @Get('analyze/:chain')
  async analyzeGas(
    @Param('chain') chain: string,
    @Query('txType') txType: string = 'erc20_transfer',
    @Query('urgency') urgency: 'low' | 'medium' | 'high' = 'medium',
  ) {
    return this.gasService.analyzeTransactionGas(chain, txType, urgency);
  }

  @Get('cross-chain')
  async getCrossChainComparison(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.gasService.getCrossChainGasComparison(from, to);
  }

  @Get('history/:chain')
  async getGasHistory(
    @Param('chain') chain: string,
    @Query('days') days: string = '7',
  ) {
    return this.gasService.getGasHistory(chain, parseInt(days, 10));
  }

  @Get('alerts/:userId')
  async getAlerts(@Param('userId') userId: string) {
    return this.gasService.getGasAlerts(userId);
  }

  @Post('alerts')
  async createAlert(
    @Body() body: { userId: string; chain: string; condition: 'above' | 'below'; threshold: number },
  ) {
    return this.gasService.createGasAlert(body.userId, body.chain, body.condition, body.threshold);
  }

  @Get('calculator')
  async calculateGas(
    @Query('txType') txType: string = 'erc20_transfer',
    @Query('chain') chain: string = 'Ethereum',
    @Query('value') value?: string,
  ) {
    return this.gasService.getGasCalculator(txType, chain, value ? parseFloat(value) : undefined);
  }

  private getChainId(chain: string): number {
    const chainMap: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      arbitrum: 42161,
      optimism: 10,
      bsc: 56,
      base: 8453,
      avalanche: 43114,
      zksync: 324,
      starknet: 0,
      linea: 59144,
    };
    return chainMap[chain.toLowerCase()] || 1;
  }
}

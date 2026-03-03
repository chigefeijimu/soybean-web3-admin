import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DefiRiskCalculatorService } from './defi-risk-calculator.service';

@ApiTags('DeFi Risk Calculator')
@Controller('web3/defi-risk-calculator')
export class DefiRiskCalculatorController {
  constructor(private readonly defiRiskCalculatorService: DefiRiskCalculatorService) {}

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported DeFi protocols for risk analysis' })
  async getSupportedProtocols() {
    return this.defiRiskCalculatorService.getSupportedProtocols();
  }

  @Get('analyze')
  @ApiOperation({ summary: 'Analyze DeFi portfolio risk' })
  @ApiQuery({ name: 'address', description: 'Wallet address to analyze' })
  @ApiQuery({ name: 'chains', description: 'Comma-separated chain names', required: false })
  async analyzePortfolioRisk(
    @Query('address') address: string,
    @Query('chains') chains?: string,
  ) {
    const chainList = chains ? chains.split(',') : ['ethereum', 'polygon', 'arbitrum', 'optimism'];
    return this.defiRiskCalculatorService.analyzePortfolioRisk(address, chainList);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate risk score for given positions' })
  async calculateRiskScore(@Body() positions: any) {
    return this.defiRiskCalculatorService.calculateRiskScore(positions);
  }

  @Get('historical')
  @ApiOperation({ summary: 'Get historical risk scores' })
  @ApiQuery({ name: 'address', description: 'Wallet address' })
  @ApiQuery({ name: 'days', description: 'Number of days', required: false })
  async getHistoricalRisk(
    @Query('address') address: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days) : 30;
    return this.defiRiskCalculatorService.getHistoricalRisk(address, daysNum);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Compare risk between multiple addresses' })
  @ApiQuery({ name: 'addresses', description: 'Comma-separated wallet addresses' })
  async compareRisk(@Query('addresses') addresses: string) {
    const addressList = addresses.split(',');
    return this.defiRiskCalculatorService.compareRisk(addressList);
  }
}

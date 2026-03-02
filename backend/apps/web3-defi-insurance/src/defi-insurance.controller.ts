import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DefiInsuranceService } from './defi-insurance.service';

@Controller('web3/insurance')
export class DefiInsuranceController {
  constructor(private readonly insuranceService: DefiInsuranceService) {}

  @Get('protocols')
  async getProtocols() {
    return this.insuranceService.getProtocols();
  }

  @Get('protocols/:name')
  async getProtocolDetails(@Param('name') name: string) {
    return this.insuranceService.getProtocolDetails(name);
  }

  @Get('coverage/:address')
  async getWalletCoverage(@Param('address') address: string) {
    return this.insuranceService.getWalletCoverage(address);
  }

  @Post('premium')
  async calculatePremium(
    @Body() body: { coverageAmount: number; protocol: string; duration: number },
  ) {
    return this.insuranceService.calculatePremium(
      body.coverageAmount,
      body.protocol,
      body.duration,
    );
  }

  @Get('stats')
  async getMarketStats() {
    return this.insuranceService.getMarketStats();
  }

  @Get('claims')
  async getClaimsHistory() {
    return this.insuranceService.getClaimsHistory();
  }

  @Get('recommendations')
  async getRecommendedCoverage(@Query('portfolioValue') portfolioValue: string) {
    const value = parseFloat(portfolioValue) || 100000;
    return this.insuranceService.getRecommendedCoverage(value);
  }

  @Get('compare')
  async compareProviders(
    @Query('protocol') protocol: string,
    @Query('coverageAmount') coverageAmount: string,
  ) {
    const amount = parseFloat(coverageAmount) || 50000;
    return this.insuranceService.compareProviders(protocol || 'uniswap-v3', amount);
  }
}

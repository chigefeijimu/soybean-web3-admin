import { Controller, Get, Param, Query } from '@nestjs/common';
import { StablecoinYieldService, ProtocolYield, YieldComparison } from './stablecoin-yield.service';

@Controller('web3/stablecoin-yield')
export class StablecoinYieldController {
  constructor(private readonly stablecoinYieldService: StablecoinYieldService) {}

  /**
   * Get comprehensive yield comparison across all stablecoins
   */
  @Get('comparison')
  async getYieldComparison(): Promise<YieldComparison[]> {
    return this.stablecoinYieldService.getYieldComparison();
  }

  /**
   * Get yields for a specific token
   */
  @Get('token/:symbol')
  async getYieldsByToken(@Param('symbol') symbol: string): Promise<ProtocolYield[]> {
    return this.stablecoinYieldService.getYieldsByToken(symbol);
  }

  /**
   * Get yields for a specific chain
   */
  @Get('chain/:chain')
  async getYieldsByChain(@Param('chain') chain: string): Promise<ProtocolYield[]> {
    return this.stablecoinYieldService.getYieldsByChain(chain);
  }

  /**
   * Get top yields sorted by APY
   */
  @Get('top')
  async getTopYields(@Query('limit') limit?: string): Promise<ProtocolYield[]> {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.stablecoinYieldService.getTopYields(numLimit);
  }

  /**
   * Get yields for a specific protocol
   */
  @Get('protocol/:protocol')
  async getProtocolYields(@Param('protocol') protocol: string): Promise<ProtocolYield[]> {
    return this.stablecoinYieldService.getProtocolYields(protocol);
  }

  /**
   * Get supported chains
   */
  @Get('chains')
  async getSupportedChains(): Promise<string[]> {
    return this.stablecoinYieldService.getSupportedChains();
  }

  /**
   * Get supported protocols
   */
  @Get('protocols')
  async getSupportedProtocols(): Promise<string[]> {
    return this.stablecoinYieldService.getSupportedProtocols();
  }

  /**
   * Calculate potential earnings
   */
  @Get('earnings')
  async calculateEarnings(
    @Query('principal') principal: string,
    @Query('token') token: string,
    @Query('days') days?: string
  ): Promise<{ earnings: number; finalAmount: number; apy: number }> {
    const principalNum = parseFloat(principal);
    const daysNum = days ? parseInt(days, 10) : 30;
    
    if (isNaN(principalNum) || principalNum <= 0) {
      return { earnings: 0, finalAmount: 0, apy: 0 };
    }
    
    return this.stablecoinYieldService.calculateEarnings(principalNum, token, daysNum);
  }
}

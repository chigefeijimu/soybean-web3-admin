import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { Web3RugpullService } from './web3-rugpull.service';

@Controller('web3/rugpull')
export class Web3RugpullController {
  constructor(private readonly rugpullService: Web3RugpullService) {}

  @Get('analyze/:tokenAddress')
  async analyzeToken(@Param('tokenAddress') tokenAddress: string, @Query('chainId') chainId?: string) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    return this.rugpullService.analyzeToken(tokenAddress, chain);
  }

  @Get('risk-score/:tokenAddress')
  async getRiskScore(@Param('tokenAddress') tokenAddress: string, @Query('chainId') chainId?: string) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    return this.rugpullService.calculateRiskScore(tokenAddress, chain);
  }

  @Post('batch-analyze')
  async batchAnalyze(@Body() body: { tokens: string[]; chainId?: number }) {
    const chain = body.chainId || 1;
    const results = await Promise.all(
      body.tokens.map(token => this.rugpullService.analyzeToken(token, chain))
    );
    return results;
  }

  @Get('suspicious-tokens')
  async getSuspiciousTokens(@Query('chainId') chainId?: string, @Query('limit') limit?: string) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    const maxResults = limit ? parseInt(limit, 10) : 20;
    return this.rugpullService.getSuspiciousTokens(chain, maxResults);
  }

  @Get('honeypot-check/:tokenAddress')
  async checkHoneypot(@Param('tokenAddress') tokenAddress: string, @Query('chainId') chainId?: string) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    return this.rugpullService.checkHoneypot(tokenAddress, chain);
  }

  @Get('liquidity-analysis/:tokenAddress')
  async analyzeLiquidity(@Param('tokenAddress') tokenAddress: string, @Query('chainId') chainId?: string) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    return this.rugpullService.analyzeLiquidity(tokenAddress, chain);
  }

  @Get('holder-analysis/:tokenAddress')
  async analyzeHolders(@Param('tokenAddress') tokenAddress: string, @Query('chainId') chainId?: string) {
    const chain = chainId ? parseInt(chainId, 10) : 1;
    return this.rugpullService.analyzeHolders(tokenAddress, chain);
  }
}

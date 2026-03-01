import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DefiPortfolioService } from './defi-portfolio.service';

@ApiTags('Web3 DeFi Portfolio Tracker')
@Controller('api/web3/defi-portfolio')
export class DefiPortfolioController {
  constructor(private readonly defiPortfolioService: DefiPortfolioService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get DeFi portfolio for a wallet address' })
  @ApiQuery({ name: 'walletAddress', description: 'Wallet address to query', required: true })
  @ApiQuery({ name: 'chainId', description: 'Chain ID (default: 1)', required: false })
  @ApiQuery({ name: 'protocols', description: 'Comma-separated protocol names', required: false })
  async getPortfolio(
    @Query('walletAddress') walletAddress: string,
    @Query('chainId') chainId?: string,
    @Query('protocols') protocols?: string,
  ) {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }
    
    return this.defiPortfolioService.getPortfolio(
      walletAddress, 
      chainId ? parseInt(chainId, 10) : 1,
      protocols
    );
  }

  @Post('portfolio')
  @ApiOperation({ summary: 'Get DeFi portfolio for a wallet address (POST)' })
  async getPortfolioPost(
    @Body() body: { walletAddress: string; chainId?: number; protocols?: string },
  ) {
    return this.defiPortfolioService.getPortfolio(
      body.walletAddress,
      body.chainId || 1,
      body.protocols
    );
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get list of supported DeFi protocols' })
  async getProtocols() {
    return this.defiPortfolioService.getProtocols();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

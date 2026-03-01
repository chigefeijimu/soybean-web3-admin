import { Controller, Get, Post, Body, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DefiPortfolioService } from './defi-portfolio.service';
import { QueryPortfolioDto, DefiPortfolioDto } from './dto/defi-portfolio.dto';

@ApiTags('Web3 DeFi Portfolio')
@Controller('web3/defi-portfolio')
export class DefiPortfolioController {
  constructor(private readonly defiPortfolioService: DefiPortfolioService) {}

  @Get('portfolio')
  @ApiOperation({ summary: 'Get DeFi portfolio for a wallet address' })
  @ApiQuery({ name: 'walletAddress', description: 'Wallet address to query', required: true })
  @ApiQuery({ name: 'chainId', description: 'Chain ID (default: 1)', required: false })
  @ApiQuery({ name: 'protocols', description: 'Comma-separated protocol names', required: false })
  @ApiResponse({ status: 200, description: 'Returns DeFi portfolio data', type: DefiPortfolioDto })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  async getPortfolio(
    @Query('walletAddress') walletAddress: string,
    @Query('chainId') chainId?: string,
    @Query('protocols') protocols?: string,
  ): Promise<DefiPortfolioDto> {
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get DeFi portfolio for a wallet address (POST)' })
  @ApiResponse({ status: 200, description: 'Returns DeFi portfolio data', type: DefiPortfolioDto })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  async getPortfolioPost(@Body() query: QueryPortfolioDto): Promise<DefiPortfolioDto> {
    return this.defiPortfolioService.getPortfolio(
      query.walletAddress,
      query.chainId || 1,
      query.protocols
    );
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get list of supported DeFi protocols' })
  @ApiResponse({ status: 200, description: 'Returns list of protocols' })
  async getProtocols() {
    return this.defiPortfolioService.getProtocols();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

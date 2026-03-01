import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TaxLossHarvesterService, PortfolioPosition, HarvestingOpportunity, TaxSummary } from './tax-loss-harvester.service';

class AnalyzePortfolioDto {
  address: string;
  chainId: number;
}

class AddPositionDto {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chainId: number;
  purchasePrice: number;
  quantity: number;
  purchaseDate?: string;
}

@Controller('web3/tax-loss')
export class TaxLossHarvesterController {
  constructor(private readonly taxLossHarvesterService: TaxLossHarvesterService) {}

  @Get('portfolio/:address/:chainId')
  async getPortfolio(
    @Param('address') address: string,
    @Param('chainId') chainId: number,
  ): Promise<{ positions: PortfolioPosition[]; summary: TaxSummary }> {
    return this.taxLossHarvesterService.getPortfolioPositions(address, chainId);
  }

  @Post('portfolio')
  async analyzePortfolio(@Body() dto: AnalyzePortfolioDto): Promise<{ positions: PortfolioPosition[]; summary: TaxSummary }> {
    return this.taxLossHarvesterService.getPortfolioPositions(dto.address, dto.chainId);
  }

  @Get('opportunities/:address/:chainId')
  async getHarvestingOpportunities(
    @Param('address') address: string,
    @Param('chainId') chainId: number,
  ): Promise<{ opportunities: HarvestingOpportunity[]; totalPotentialSavings: number }> {
    return this.taxLossHarvesterService.getHarvestingOpportunities(address, chainId);
  }

  @Post('position')
  async addPosition(@Body() dto: AddPositionDto): Promise<PortfolioPosition> {
    return this.taxLossHarvesterService.addPosition(
      dto.tokenAddress,
      dto.tokenSymbol,
      dto.tokenName,
      dto.chainId,
      dto.purchasePrice,
      dto.quantity,
      dto.purchaseDate,
    );
  }

  @Get('token-price/:chainId/:address')
  async getTokenPrice(
    @Param('chainId') chainId: number,
    @Param('address') address: string,
  ): Promise<{ price: number; change24h: number; priceHistory: number[] }> {
    return this.taxLossHarvesterService.getTokenPrice(chainId, address);
  }

  @Get('market/prices')
  async getMarketPrices(
    @Query('tokens') tokens: string, // comma-separated addresses
    @Query('chainId') chainId: number,
  ): Promise<Record<string, { price: number; change24h: number }>> {
    const tokenList = tokens.split(',');
    return this.taxLossHarvesterService.getMultipleTokenPrices(chainId, tokenList);
  }
}

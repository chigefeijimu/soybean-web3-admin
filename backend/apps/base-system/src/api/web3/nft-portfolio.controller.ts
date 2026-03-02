import { Controller, Get, Param, Query } from '@nestjs/common';
import { NftPortfolioService } from './nft-portfolio.service';

@Controller('web3/nft-portfolio')
export class NftPortfolioController {
  constructor(private readonly nftPortfolioService: NftPortfolioService) {}

  /**
   * Get NFT portfolio for a wallet address
   */
  @Get('portfolio/:address')
  async getPortfolio(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.nftPortfolioService.getPortfolio(address, chain);
  }

  /**
   * Get collection statistics
   */
  @Get('collection/:address')
  async getCollectionStats(
    @Param('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.nftPortfolioService.getCollectionStats(address, chain);
  }

  /**
   * Get NFT rarity analysis
   */
  @Get('rarity/:contractAddress/:tokenId')
  async getNftRarity(
    @Param('contractAddress') contractAddress: string,
    @Param('tokenId') tokenId: string,
  ) {
    return this.nftPortfolioService.getNftRarity(contractAddress, tokenId);
  }

  /**
   * Get market trends
   */
  @Get('trends')
  async getMarketTrends() {
    return this.nftPortfolioService.getMarketTrends();
  }

  /**
   * Get portfolio value history
   */
  @Get('history/:address')
  async getPortfolioHistory(
    @Param('address') address: string,
    @Query('days') days: number = 30,
  ) {
    return this.nftPortfolioService.getPortfolioHistory(address, days);
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { NftPortfolioTrackerService } from './nft-portfolio-tracker.service';

@Controller('nft-portfolio')
export class NftPortfolioTrackerController {
  constructor(private readonly nftPortfolioService: NftPortfolioTrackerService) {}

  @Get('holdings/:address')
  getHoldings(@Param('address') address: string) {
    return this.nftPortfolioService.getMockHoldings(address);
  }

  @Get('summary/:address')
  getPortfolioSummary(@Param('address') address: string) {
    return this.nftPortfolioService.getPortfolioSummary(address);
  }

  @Get('collection/:address')
  getCollectionAnalytics(@Param('address') address: string) {
    return this.nftPortfolioService.getCollectionAnalytics(address);
  }

  @Get('trending')
  getTrendingCollections(@Query('chain') chain?: string) {
    return this.nftPortfolioService.getTrendingCollections(chain);
  }
}

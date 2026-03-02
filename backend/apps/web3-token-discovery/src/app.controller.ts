import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('trending')
  async getTrendingTokens(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: string = '20',
  ) {
    return this.appService.getTrendingTokens(chain, parseInt(limit));
  }

  @Get('new-listings')
  async getNewListings(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: string = '20',
  ) {
    return this.appService.getNewListings(chain, parseInt(limit));
  }

  @Get('gainers')
  async getGainers(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: string = '20',
    @Query('timeframe') timeframe: string = '24h',
  ) {
    return this.appService.getGainers(chain, parseInt(limit), timeframe);
  }

  @Get('losers')
  async getLosers(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: string = '20',
    @Query('timeframe') timeframe: string = '24h',
  ) {
    return this.appService.getLosers(chain, parseInt(limit), timeframe);
  }

  @Get('high-volume')
  async getHighVolumeTokens(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: string = '20',
  ) {
    return this.appService.getHighVolumeTokens(chain, parseInt(limit));
  }

  @Get('search')
  async searchTokens(
    @Query('q') query: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.appService.searchTokens(query, chain);
  }

  @Get('screener')
  async screenTokens(
    @Query('minMarketCap') minMarketCap: string = '0',
    @Query('maxMarketCap') maxMarketCap: string = '1000000000',
    @Query('minVolume') minVolume: string = '10000',
    @Query('minLiquidity') minLiquidity: string = '10000',
    @Query('chain') chain: string = 'ethereum',
    @Query('sortBy') sortBy: string = 'volume',
    @Query('limit') limit: string = '50',
  ) {
    return this.appService.screenTokens({
      chain,
      minMarketCap: parseFloat(minMarketCap),
      maxMarketCap: parseFloat(maxMarketCap),
      minVolume: parseFloat(minVolume),
      minLiquidity: parseFloat(minLiquidity),
      sortBy,
      limit: parseInt(limit),
    });
  }

  @Get('token-details')
  async getTokenDetails(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    return this.appService.getTokenDetails(address, chain);
  }

  @Get('watchlist')
  async getWatchlist(@Query('addresses') addresses: string) {
    return this.appService.getWatchlistTokens(addresses ? addresses.split(',') : []);
  }

  @Get('market-stats')
  async getMarketStats(@Query('chain') chain: string = 'ethereum') {
    return this.appService.getMarketStats(chain);
  }
}
